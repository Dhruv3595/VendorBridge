const pool = require('../db/db');

async function getStats(req, res) {
  try {
    const activeRfqs = await pool.query(
      "SELECT COUNT(*)::int AS count FROM rfqs WHERE status = 'Active'"
    );
    const pendingApprovals = await pool.query(
      "SELECT COUNT(*)::int AS count FROM approvals WHERE status = 'Pending'"
    );
    const posThisMonth = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM purchase_orders
       WHERE created_at >= date_trunc('month', CURRENT_DATE)`
    );
    const overdueInvoices = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM invoices
       WHERE due_date < CURRENT_DATE AND status <> 'Paid'`
    );
    const recentPOs = await pool.query(
      `SELECT po.id, po.po_number, po.status, po.created_at, r.title AS rfq_title, v.name AS vendor_name
       FROM purchase_orders po
       LEFT JOIN quotations q ON po.quotation_id = q.id
       LEFT JOIN rfqs r ON po.rfq_id = r.id
       LEFT JOIN vendors v ON q.vendor_id = v.id
       ORDER BY po.created_at DESC
       LIMIT 5`
    );

    res.json({
      activeRfqs: activeRfqs.rows[0].count,
      pendingApprovals: pendingApprovals.rows[0].count,
      posThisMonth: posThisMonth.rows[0].count,
      overdueInvoices: overdueInvoices.rows[0].count,
      recentPOs: recentPOs.rows,
      spendingTrends: [
        { month: 'Jan', amount: 45000 },
        { month: 'Feb', amount: 62000 },
        { month: 'Mar', amount: 50000 },
        { month: 'Apr', amount: 78000 },
        { month: 'May', amount: 90000 },
        { month: 'Jun', amount: 65000 }
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load dashboard stats' });
  }
}

module.exports = { getStats };
