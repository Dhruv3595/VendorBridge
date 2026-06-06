const pool = require('../db/db');

function toNumber(value) {
  return Number(value || 0);
}

async function monthlySpend() {
  const result = await pool.query(
    `SELECT TO_CHAR(DATE_TRUNC('month', i.created_at), 'Mon') AS month,
            COALESCE(SUM(qi.quantity * qi.unit_price), 0) * 1.18 AS amount
     FROM invoices i
     JOIN purchase_orders po ON i.po_id = po.id
     LEFT JOIN quotations q ON po.quotation_id = q.id
     LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
     WHERE i.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
     GROUP BY DATE_TRUNC('month', i.created_at)
     ORDER BY DATE_TRUNC('month', i.created_at)`
  );

  return result.rows.map((row) => ({ month: row.month, amount: toNumber(row.amount) }));
}

async function recentPurchaseOrders(extraWhere = '', values = []) {
  const result = await pool.query(
    `SELECT po.id, po.po_number, po.status, po.created_at, r.title AS rfq_title, v.name AS vendor_name
     FROM purchase_orders po
     LEFT JOIN quotations q ON po.quotation_id = q.id
     LEFT JOIN rfqs r ON po.rfq_id = r.id
     LEFT JOIN vendors v ON q.vendor_id = v.id
     ${extraWhere}
     ORDER BY po.created_at DESC
     LIMIT 5`,
    values
  );

  return result.rows;
}

async function getStats(req, res) {
  try {
    if (req.user.role === 'Vendor') {
      const vendorId = req.user.vendorId || 0;
      const assignedRfqs = await pool.query(
        'SELECT COUNT(*)::int AS count FROM rfq_vendors WHERE vendor_id = $1',
        [vendorId]
      );
      const submitted = await pool.query(
        "SELECT COUNT(*)::int AS count FROM quotations WHERE vendor_id = $1 AND status IN ('Submitted', 'Selected', 'Not Selected')",
        [vendorId]
      );
      const selected = await pool.query(
        "SELECT COUNT(*)::int AS count FROM quotations WHERE vendor_id = $1 AND status = 'Selected'",
        [vendorId]
      );
      const pendingInvoices = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM invoices i
         JOIN purchase_orders po ON i.po_id = po.id
         JOIN quotations q ON po.quotation_id = q.id
         WHERE q.vendor_id = $1 AND i.status <> 'Paid'`,
        [vendorId]
      );

      return res.json({
        activeRfqs: assignedRfqs.rows[0].count,
        pendingApprovals: selected.rows[0].count,
        posThisMonth: submitted.rows[0].count,
        overdueInvoices: pendingInvoices.rows[0].count,
        recentPOs: await recentPurchaseOrders('WHERE q.vendor_id = $1', [vendorId]),
        spendingTrends: await monthlySpend()
      });
    }

    if (req.user.role === 'Manager') {
      const pendingApprovals = await pool.query(
        "SELECT COUNT(*)::int AS count FROM approvals WHERE status = 'Pending' AND approver_id = $1",
        [req.user.id]
      );
      const approved = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM approvals
         WHERE status = 'Approved' AND approver_id = $1 AND acted_at >= DATE_TRUNC('month', CURRENT_DATE)`,
        [req.user.id]
      );
      const rejected = await pool.query(
        `SELECT COUNT(*)::int AS count
         FROM approvals
         WHERE status = 'Rejected' AND approver_id = $1 AND acted_at >= DATE_TRUNC('month', CURRENT_DATE)`,
        [req.user.id]
      );

      return res.json({
        activeRfqs: pendingApprovals.rows[0].count,
        pendingApprovals: pendingApprovals.rows[0].count,
        posThisMonth: approved.rows[0].count,
        overdueInvoices: rejected.rows[0].count,
        recentPOs: await recentPurchaseOrders(),
        spendingTrends: await monthlySpend()
      });
    }

    const activeRfqs = await pool.query(
      "SELECT COUNT(*)::int AS count FROM rfqs WHERE status IN ('Published', 'Quotation Received', 'Under Comparison', 'Approval Pending')"
    );
    const pendingApprovals = await pool.query(
      "SELECT COUNT(*)::int AS count FROM approvals WHERE status = 'Pending'"
    );
    const posThisMonth = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM purchase_orders
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    const overdueInvoices = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM invoices
       WHERE due_date < CURRENT_DATE AND status <> 'Paid'`
    );

    res.json({
      activeRfqs: activeRfqs.rows[0].count,
      pendingApprovals: pendingApprovals.rows[0].count,
      posThisMonth: posThisMonth.rows[0].count,
      overdueInvoices: overdueInvoices.rows[0].count,
      recentPOs: await recentPurchaseOrders(),
      spendingTrends: await monthlySpend()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load dashboard stats' });
  }
}

module.exports = { getStats };
