const pool = require('../db/db');

function toNumber(value) {
  return Number(value || 0);
}

function csvValue(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function monthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabel(date) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[date.getMonth()]} ${date.getFullYear()}`;
}

async function getStats(req, res) {
  try {
    const vendors = await pool.query('SELECT COUNT(*)::int AS count FROM vendors');
    const rfqs = await pool.query('SELECT COUNT(*)::int AS count FROM rfqs');
    const pos = await pool.query('SELECT COUNT(*)::int AS count FROM purchase_orders');
    const invoices = await pool.query(
      `SELECT COALESCE(SUM(invoice_total), 0) AS total
       FROM (
         SELECT i.id, COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 1.18 AS invoice_total
         FROM invoices i
         JOIN purchase_orders po ON i.po_id = po.id
         LEFT JOIN quotations q ON po.quotation_id = q.id
         LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
         GROUP BY i.id
       ) totals`
    );

    res.json({
      total_vendors: vendors.rows[0].count,
      total_rfqs: rfqs.rows[0].count,
      total_pos: pos.rows[0].count,
      total_invoice_amount: toNumber(invoices.rows[0].total)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load report stats' });
  }
}

async function getMonthlySpend(req, res) {
  try {
    const result = await pool.query(
      `SELECT DATE_TRUNC('month', i.created_at) AS month,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 1.18 AS total
       FROM invoices i
       JOIN purchase_orders po ON i.po_id = po.id
       LEFT JOIN quotations q ON po.quotation_id = q.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       WHERE i.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
       GROUP BY 1
       ORDER BY 1`
    );

    const totalsByMonth = new Map();
    for (const row of result.rows) {
      totalsByMonth.set(monthKey(new Date(row.month)), toNumber(row.total));
    }

    const months = [];
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() - 5);

    for (let i = 0; i < 6; i += 1) {
      const current = new Date(start);
      current.setMonth(start.getMonth() + i);
      months.push({
        month: monthLabel(current),
        total: totalsByMonth.get(monthKey(current)) || 0
      });
    }

    res.json(months);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load monthly spend' });
  }
}

async function getTopVendors(req, res) {
  try {
    const result = await pool.query(
      `SELECT v.id,
              v.name AS vendor_name,
              COUNT(DISTINCT po.id)::int AS po_count,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 1.18 AS total_value
       FROM purchase_orders po
       LEFT JOIN quotations q ON po.quotation_id = q.id
       LEFT JOIN vendors v ON q.vendor_id = v.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       GROUP BY v.id, v.name
       ORDER BY po_count DESC, total_value DESC
       LIMIT 5`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load top vendors' });
  }
}

async function exportPurchaseOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT po.po_number,
              po.status,
              po.created_at,
              r.title AS rfq_title,
              v.name AS vendor_name,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 1.18 AS grand_total
       FROM purchase_orders po
       LEFT JOIN rfqs r ON po.rfq_id = r.id
       LEFT JOIN quotations q ON po.quotation_id = q.id
       LEFT JOIN vendors v ON q.vendor_id = v.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       GROUP BY po.id, r.title, v.name
       ORDER BY po.created_at DESC`
    );

    const lines = [
      'PO Number,Vendor,RFQ Title,Date,Status,Subtotal,Grand Total'
    ];

    for (const po of result.rows) {
      lines.push([
        csvValue(po.po_number),
        csvValue(po.vendor_name),
        csvValue(po.rfq_title),
        csvValue(po.created_at ? new Date(po.created_at).toISOString().slice(0, 10) : ''),
        csvValue(po.status),
        csvValue(toNumber(po.subtotal).toFixed(2)),
        csvValue(toNumber(po.grand_total).toFixed(2))
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=purchase-orders.csv');
    res.send(lines.join('\n'));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not export purchase orders' });
  }
}

module.exports = {
  getStats,
  getMonthlySpend,
  getTopVendors,
  exportPurchaseOrders
};
