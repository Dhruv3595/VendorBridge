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

function addTaxTotals(invoice, items) {
  const subtotal = items.reduce((sum, item) => sum + toNumber(item.line_total), 0);
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;

  return {
    ...invoice,
    items,
    bill_to: orgInfo,
    vendor: {
      id: invoice.vendor_id,
      name: invoice.vendor_name,
      email: invoice.vendor_email,
      phone: invoice.vendor_phone,
      address: invoice.vendor_address,
      gstin: invoice.vendor_gstin
    },
    subtotal,
    cgst,
    sgst,
    grand_total: subtotal + cgst + sgst
  };
}

async function addLog(action, description, userId, client) {
  const db = client || pool;
  await db.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

async function loadInvoiceDetail(id) {
  return loadInvoiceDetailForUser(id);
}

async function loadInvoiceDetailForUser(id, user) {
  const values = [id];
  const scope = user?.role === 'Vendor'
    ? ` AND v.id = $${values.push(user.vendorId || 0)}`
    : '';

  const invoiceResult = await pool.query(
    `SELECT i.*,
            po.po_number,
            po.created_at AS po_created_at,
            r.title AS rfq_title,
            q.notes AS quotation_notes,
            v.id AS vendor_id,
            v.name AS vendor_name,
            v.email AS vendor_email,
            v.phone AS vendor_phone,
            v.address AS vendor_address,
            v.gst_number AS vendor_gstin
     FROM invoices i
     JOIN purchase_orders po ON i.po_id = po.id
     LEFT JOIN rfqs r ON po.rfq_id = r.id
     LEFT JOIN quotations q ON po.quotation_id = q.id
     LEFT JOIN vendors v ON q.vendor_id = v.id
     WHERE i.id = $1 ${scope}`,
    values
  );

  if (invoiceResult.rows.length === 0) {
    return null;
  }

  const invoice = invoiceResult.rows[0];
  const itemsResult = await pool.query(
    `SELECT qi.id,
            qi.item_name,
            qi.quantity,
            qi.unit_price,
            qi.delivery_days,
            qi.quantity * qi.unit_price AS line_total
     FROM quotation_items qi
     JOIN purchase_orders po ON po.quotation_id = qi.quotation_id
     WHERE po.id = $1
     ORDER BY qi.id`,
    [invoice.po_id]
  );

  return addTaxTotals(invoice, itemsResult.rows);
}

async function getInvoices(req, res) {
  const values = [];
  const scope = req.user.role === 'Vendor'
    ? `WHERE q.vendor_id = $${values.push(req.user.vendorId || 0)}`
    : '';

  try {
    const result = await pool.query(
      `SELECT i.id,
              i.po_id,
              i.invoice_date,
              i.due_date,
              i.status,
              i.created_at,
              po.po_number,
              v.name AS vendor_name,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 0.09 AS cgst,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 0.09 AS sgst,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 1.18 AS grand_total
       FROM invoices i
       JOIN purchase_orders po ON i.po_id = po.id
       LEFT JOIN quotations q ON po.quotation_id = q.id
       LEFT JOIN vendors v ON q.vendor_id = v.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       ${scope}
       GROUP BY i.id, po.po_number, v.name
       ORDER BY i.created_at DESC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load invoices' });
  }
}

async function getInvoiceById(req, res) {
  try {
    const invoice = await loadInvoiceDetailForUser(req.params.id, req.user);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load invoice' });
  }
}

async function createInvoice(req, res) {
  const { po_id, invoice_date, due_date } = req.body;

  if (!po_id) {
    return res.status(400).json({ message: 'po_id is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const poResult = await client.query(
      'SELECT id, po_number FROM purchase_orders WHERE id = $1',
      [po_id]
    );

    if (poResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    const invoiceResult = await client.query(
      `INSERT INTO invoices (po_id, invoice_number, invoice_date, due_date, status)
       VALUES ($1, 'INV-TEMP-' || $1::TEXT, $2, $3, 'Pending Payment')
       RETURNING *`,
      [po_id, invoice_date || null, due_date || null]
    );
    const invoice = invoiceResult.rows[0];
    const po = poResult.rows[0];
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoice.id).padStart(5, '0')}`;

    await client.query(
      'UPDATE invoices SET invoice_number = $1 WHERE id = $2',
      [invoiceNumber, invoice.id]
    );

    await addLog(
      'Invoice generated',
      `Invoice ${invoiceNumber} generated for ${po.po_number}.`,
      req.user.id,
      client
    );

    await client.query('COMMIT');

    const detail = await loadInvoiceDetail(invoice.id);
    res.status(201).json(detail);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not create invoice' });
  } finally {
    client.release();
  }
}

async function markInvoicePaid(req, res) {
  try {
    const result = await pool.query(
      `UPDATE invoices
       SET status = 'Paid'
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await addLog('Invoice paid', `Invoice #${req.params.id} marked as paid.`, req.user.id);

    const detail = await loadInvoiceDetail(req.params.id);
    res.json(detail);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not mark invoice as paid' });
  }
}

function writeInvoicePdf(doc, invoice) {
  doc.fontSize(20).text('VendorBridge Invoice', { align: 'center' });
  doc.moveDown();

  doc.fontSize(11).text(`Invoice ID: ${invoice.id}`);
  doc.text(`PO Number: ${invoice.po_number || '-'}`);
  doc.text(`Invoice Date: ${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '-'}`);
  doc.text(`Due Date: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}`);
  doc.moveDown();

  doc.fontSize(13).text('Bill To');
  doc.fontSize(10).text(invoice.bill_to.name);
  doc.text(invoice.bill_to.address);
  doc.text(`GSTIN: ${invoice.bill_to.gstin}`);
  doc.moveDown();

  doc.fontSize(13).text('Vendor');
  doc.fontSize(10).text(invoice.vendor.name || '-');
  doc.text(invoice.vendor.address || '-');
  doc.text(`GSTIN: ${invoice.vendor.gstin || '-'}`);
  doc.moveDown();

  const startY = doc.y + 10;
  doc.fontSize(10).text('Item', 50, startY);
  doc.text('Qty', 250, startY);
  doc.text('Unit Price', 320, startY);
  doc.text('Total', 440, startY);
  doc.moveTo(50, startY + 16).lineTo(540, startY + 16).stroke();

  let y = startY + 26;
  for (const item of invoice.items) {
    doc.text(item.item_name, 50, y, { width: 180 });
    doc.text(toNumber(item.quantity).toFixed(2), 250, y);
    doc.text(money(item.unit_price), 320, y);
    doc.text(money(item.line_total), 440, y);
    y += 24;
  }

  doc.moveTo(50, y).lineTo(540, y).stroke();
  y += 14;
  doc.text('Subtotal', 360, y);
  doc.text(money(invoice.subtotal), 440, y);
  y += 18;
  doc.text('CGST 9%', 360, y);
  doc.text(money(invoice.cgst), 440, y);
  y += 18;
  doc.text('SGST 9%', 360, y);
  doc.text(money(invoice.sgst), 440, y);
  y += 18;
  doc.fontSize(12).text('Grand Total', 360, y);
  doc.text(money(invoice.grand_total), 440, y);
}

function buildInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    writeInvoicePdf(doc, invoice);
    doc.end();
  });
}

async function getInvoicePdf(req, res) {
  try {
    const invoice = await loadInvoiceDetailForUser(req.params.id, req.user);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdf = await buildInvoicePdf(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.id}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not generate invoice PDF' });
  }
}

async function emailInvoice(req, res) {
  try {
    const invoice = await loadInvoiceDetail(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const pdf = await buildInvoicePdf(invoice);
    const info = await transporter.sendMail({
      from: `"VendorBridge" <${testAccount.user}>`,
      to: invoice.vendor.email || testAccount.user,
      subject: `Invoice #${invoice.id} for ${invoice.po_number}`,
      text: `Please find invoice #${invoice.id} attached.`,
      attachments: [
        {
          filename: `invoice-${invoice.id}.pdf`,
          content: pdf,
          contentType: 'application/pdf'
        }
      ]
    });

    await addLog('Invoice emailed', `Invoice #${invoice.id} emailed to ${invoice.vendor.email || 'demo inbox'}.`, req.user.id);

    res.json({
      message: 'Invoice email sent',
      preview_url: nodemailer.getTestMessageUrl(info)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not email invoice' });
  }
}

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  markInvoicePaid,
  getInvoicePdf,
  emailInvoice
};
