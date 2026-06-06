const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const pool = require('../db/db');

const orgInfo = {
  name: 'VendorBridge Procurement',
  address: 'Ahmedabad, Gujarat, India',
  gstin: '24AAFCV1234A1Z5'
};

function toNumber(value) {
  return Number(value || 0);
}

function money(value) {
  return `Rs. ${toNumber(value).toFixed(2)}`;
}

async function addLog(action, description, userId, client) {
  const db = client || pool;
  await db.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

async function loadPoDetail(id, user) {
  const values = [id];
  const scope = user?.role === 'Vendor'
    ? ` AND q.vendor_id = $${values.push(user.vendorId || 0)}`
    : '';

  const poResult = await pool.query(
    `SELECT po.*,
            r.title AS rfq_title,
            r.category AS rfq_category,
            q.tax_percent,
            q.notes AS quotation_notes,
            v.id AS vendor_id,
            v.name AS vendor_name,
            v.email AS vendor_email,
            v.phone AS vendor_phone,
            v.address AS vendor_address,
            v.gst_number AS vendor_gstin,
            EXISTS(SELECT 1 FROM invoices i WHERE i.po_id = po.id) AS invoice_exists
     FROM purchase_orders po
     LEFT JOIN rfqs r ON po.rfq_id = r.id
     LEFT JOIN quotations q ON po.quotation_id = q.id
     LEFT JOIN vendors v ON q.vendor_id = v.id
     WHERE po.id = $1 ${scope}`,
    values
  );

  if (poResult.rows.length === 0) return null;

  const po = poResult.rows[0];
  const itemsResult = await pool.query(
    `SELECT id,
            item_name,
            quantity,
            unit_price,
            delivery_days,
            quantity * unit_price AS line_total
     FROM quotation_items
     WHERE quotation_id = $1
     ORDER BY id`,
    [po.quotation_id]
  );

  const subtotal = itemsResult.rows.reduce((sum, item) => sum + toNumber(item.line_total), 0);
  const taxPercent = toNumber(po.tax_percent);
  const taxAmount = subtotal * taxPercent / 100;
  const grandTotal = subtotal + taxAmount;

  return {
    ...po,
    bill_to: orgInfo,
    vendor: {
      id: po.vendor_id,
      name: po.vendor_name,
      email: po.vendor_email,
      phone: po.vendor_phone,
      address: po.vendor_address,
      gstin: po.vendor_gstin
    },
    items: itemsResult.rows,
    subtotal,
    tax_amount: taxAmount,
    grand_total: grandTotal
  };
}

async function getPurchaseOrders(req, res) {
  const values = [];
  const scope = req.user.role === 'Vendor'
    ? `WHERE q.vendor_id = $${values.push(req.user.vendorId || 0)}`
    : '';

  try {
    const result = await pool.query(
      `SELECT po.id,
              po.po_number,
              po.status,
              po.created_at,
              po.rfq_id,
              po.quotation_id,
              r.title AS rfq_title,
              v.id AS vendor_id,
              v.name AS vendor_name,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal
       FROM purchase_orders po
       LEFT JOIN rfqs r ON po.rfq_id = r.id
       LEFT JOIN quotations q ON po.quotation_id = q.id
       LEFT JOIN vendors v ON q.vendor_id = v.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       ${scope}
       GROUP BY po.id, r.title, v.id, v.name
       ORDER BY po.created_at DESC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load purchase orders' });
  }
}

async function getPurchaseOrderById(req, res) {
  try {
    const po = await loadPoDetail(req.params.id, req.user);
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });
    res.json(po);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load purchase order' });
  }
}

// PATCH /api/purchase-orders/:id/status
async function updatePoStatus(req, res) {
  const { status } = req.body;
  const allowed = ['Generated', 'Sent', 'Accepted', 'Completed'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const result = await pool.query(
      'UPDATE purchase_orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    await addLog('PO status updated', `PO ${result.rows[0].po_number} status changed to ${status}.`, req.user.id);
    const po = await loadPoDetail(req.params.id, req.user);
    res.json(po);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update PO status' });
  }
}

// POST /api/purchase-orders
async function createPurchaseOrder(req, res) {
  const { po_number, rfq_id, quotation_id, status } = req.body;

  if (!quotation_id) {
    return res.status(400).json({ message: 'Quotation ID is required to manually create a PO' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO purchase_orders (po_number, rfq_id, quotation_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [po_number || `PO-${Date.now()}`, rfq_id || null, quotation_id, status || 'Generated']
    );

    const po = await loadPoDetail(result.rows[0].id, req.user);
    await addLog('PO created manually', `PO ${po.po_number} was created.`, req.user.id);
    res.status(201).json(po);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create purchase order' });
  }
}

// Build PDF buffer for a PO
function buildPoPdf(po) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('PURCHASE ORDER', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11)
      .text(`PO Number: ${po.po_number}`, { align: 'center' })
      .text(`Date: ${po.created_at ? new Date(po.created_at).toLocaleDateString() : '-'}`, { align: 'center' })
      .text(`Status: ${po.status}`, { align: 'center' });
    doc.moveDown();

    // Bill To / Vendor
    const colLeft = 50;
    const colRight = 320;
    const y1 = doc.y;

    doc.fontSize(12).text('Bill To:', colLeft, y1);
    doc.fontSize(10)
      .text(po.bill_to.name, colLeft, y1 + 18)
      .text(po.bill_to.address, colLeft, y1 + 32)
      .text(`GSTIN: ${po.bill_to.gstin}`, colLeft, y1 + 46);

    doc.fontSize(12).text('Vendor:', colRight, y1);
    doc.fontSize(10)
      .text(po.vendor.name || '-', colRight, y1 + 18)
      .text(po.vendor.address || '-', colRight, y1 + 32)
      .text(`GSTIN: ${po.vendor.gstin || '-'}`, colRight, y1 + 46)
      .text(po.vendor.email || '-', colRight, y1 + 60);

    doc.moveDown(5);

    // RFQ reference
    doc.fontSize(10).text(`RFQ: ${po.rfq_title || '-'}`);
    doc.moveDown(0.5);

    // Items table header
    const tableY = doc.y + 4;
    doc.fontSize(10)
      .text('Item', colLeft, tableY, { width: 180 })
      .text('Qty', 250, tableY)
      .text('Unit Price', 310, tableY)
      .text('Total', 440, tableY);
    doc.moveTo(colLeft, tableY + 16).lineTo(540, tableY + 16).stroke();

    let rowY = tableY + 26;
    for (const item of po.items) {
      doc.text(item.item_name, colLeft, rowY, { width: 180 })
        .text(toNumber(item.quantity).toFixed(2), 250, rowY)
        .text(money(item.unit_price), 310, rowY)
        .text(money(item.line_total), 440, rowY);
      rowY += 22;
    }

    // Totals
    doc.moveTo(colLeft, rowY).lineTo(540, rowY).stroke();
    rowY += 12;
    doc.text('Subtotal', 360, rowY).text(money(po.subtotal), 440, rowY);
    rowY += 18;
    doc.text(`Tax (${po.tax_percent}%)`, 360, rowY).text(money(po.tax_amount), 440, rowY);
    rowY += 18;
    doc.fontSize(12).text('Grand Total', 360, rowY).text(money(po.grand_total), 440, rowY);

    doc.end();
  });
}

// GET /api/purchase-orders/:id/pdf
async function getPoPdf(req, res) {
  try {
    const po = await loadPoDetail(req.params.id, req.user);
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });

    const pdf = await buildPoPdf(po);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=PO-${po.po_number}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not generate PO PDF' });
  }
}

// POST /api/purchase-orders/:id/email
async function emailPo(req, res) {
  try {
    const po = await loadPoDetail(req.params.id, req.user);
    if (!po) return res.status(404).json({ message: 'Purchase order not found' });

    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const pdf = await buildPoPdf(po);
    const info = await transporter.sendMail({
      from: `"VendorBridge" <${testAccount.user}>`,
      to: po.vendor.email || testAccount.user,
      subject: `Purchase Order ${po.po_number} from VendorBridge`,
      text: `Please find Purchase Order ${po.po_number} attached. Grand Total: ${money(po.grand_total)}.`,
      attachments: [{
        filename: `${po.po_number}.pdf`,
        content: pdf,
        contentType: 'application/pdf'
      }]
    });

    await addLog('PO emailed', `PO ${po.po_number} emailed to ${po.vendor.email || 'demo inbox'}.`, req.user.id);

    res.json({
      message: 'PO email sent',
      preview_url: nodemailer.getTestMessageUrl(info)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not email PO' });
  }
}

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePoStatus,
  createPurchaseOrder,
  getPoPdf,
  emailPo
};
