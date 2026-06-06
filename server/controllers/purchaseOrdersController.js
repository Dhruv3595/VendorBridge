const pool = require('../db/db');

const orgInfo = {
  name: 'VendorBridge Procurement',
  address: 'Ahmedabad, Gujarat, India',
  gstin: '24AAFCV1234A1Z5'
};

function toNumber(value) {
  return Number(value || 0);
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
  const values = [req.params.id];
  const scope = req.user.role === 'Vendor'
    ? ` AND q.vendor_id = $${values.push(req.user.vendorId || 0)}`
    : '';

  try {
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
              v.gst_number AS vendor_gstin
       FROM purchase_orders po
       LEFT JOIN rfqs r ON po.rfq_id = r.id
       LEFT JOIN quotations q ON po.quotation_id = q.id
       LEFT JOIN vendors v ON q.vendor_id = v.id
       WHERE po.id = $1 ${scope}`,
      values
    );

    if (poResult.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

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

    const subtotal = itemsResult.rows.reduce((sum, item) => {
      return sum + toNumber(item.line_total);
    }, 0);

    res.json({
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
      subtotal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load purchase order' });
  }
}

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById
};
