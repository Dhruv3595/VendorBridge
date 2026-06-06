const pool = require('../db/db');

// Reusable activity logger
async function addLog(action, description, userId) {
  await pool.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

// GET /api/approvals — list all approvals, joining quotation + rfq + vendor info
async function getApprovals(req, res) {
  try {
    const result = await pool.query(
      `SELECT a.*,
              u.name AS approver_name,
              q.status AS quotation_status,
              q.tax_percent,
              v.name AS vendor_name,
              r.title AS rfq_title,
              r.id AS rfq_id
       FROM approvals a
       LEFT JOIN users u ON a.approver_id = u.id
       JOIN quotations q ON a.quotation_id = q.id
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       ORDER BY a.id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load approvals' });
  }
}

// GET /api/approvals/:id — single approval with full detail
async function getApprovalById(req, res) {
  try {
    const result = await pool.query(
      `SELECT a.*,
              u.name AS approver_name,
              v.name AS vendor_name,
              r.title AS rfq_title,
              r.id AS rfq_id,
              q.tax_percent,
              q.notes,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * q.tax_percent / 100 AS tax_amount,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * (1 + q.tax_percent / 100) AS grand_total,
              MAX(qi.delivery_days) AS max_delivery_days
       FROM approvals a
       LEFT JOIN users u ON a.approver_id = u.id
       JOIN quotations q ON a.quotation_id = q.id
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       WHERE a.id = $1
       GROUP BY a.id, u.name, v.name, r.title, r.id, q.tax_percent, q.notes`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Approval not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load approval' });
  }
}

// POST /api/approvals — create an approval record when a quotation is selected
async function createApproval(req, res) {
  const { quotation_id, approver_id, level } = req.body;

  if (!quotation_id || !level) {
    return res.status(400).json({ message: 'quotation_id and level are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO approvals (quotation_id, approver_id, level, status)
       VALUES ($1, $2, $3, 'Pending')
       RETURNING *`,
      [quotation_id, approver_id || null, level]
    );

    await addLog('Approval created', `Approval #${result.rows[0].id} created for quotation #${quotation_id}.`, req.session?.user?.id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create approval' });
  }
}

// PATCH /api/approvals/:id/approve — approve and auto-generate PO if all levels done
async function approveApproval(req, res) {
  const { remarks } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Mark this approval as approved
    const result = await client.query(
      `UPDATE approvals
       SET status = 'Approved', remarks = $1, acted_at = NOW()
       WHERE id = $2 AND status = 'Pending'
       RETURNING *`,
      [remarks || null, req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pending approval not found' });
    }

    const approval = result.rows[0];

    // Check if all approvals for this quotation are now approved
    const pendingCheck = await client.query(
      `SELECT COUNT(*) FROM approvals
       WHERE quotation_id = $1 AND status = 'Pending'`,
      [approval.quotation_id]
    );

    const stillPending = parseInt(pendingCheck.rows[0].count, 10);

    if (stillPending === 0) {
      // All levels approved — auto-generate the Purchase Order.
      // Use a temporary po_number first, then update with the real id-based number.
      const poResult = await client.query(
        `INSERT INTO purchase_orders (rfq_id, quotation_id, po_number, status)
         SELECT q.rfq_id, q.id, 'PO-TEMP-' || q.id::TEXT, 'Created'
         FROM quotations q
         WHERE q.id = $1
         RETURNING *`,
        [approval.quotation_id]
      );

      if (poResult.rows.length > 0) {
        const po = poResult.rows[0];
        // Format: PO-2025-0001 using the actual PO id for uniqueness
        const year = new Date().getFullYear();
        const poNumber = `PO-${year}-${String(po.id).padStart(4, '0')}`;
        await client.query(
          'UPDATE purchase_orders SET po_number = $1 WHERE id = $2',
          [poNumber, po.id]
        );
        await addLog('PO generated', `Purchase Order ${poNumber} created for quotation #${approval.quotation_id}.`, req.session?.user?.id);
      }
    }

    await client.query('COMMIT');

    await addLog('Approval approved', `Approval #${req.params.id} was approved.`, req.session?.user?.id);
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not approve' });
  } finally {
    client.release();
  }
}

// PATCH /api/approvals/:id/reject — reject the approval
async function rejectApproval(req, res) {
  const { remarks } = req.body;

  try {
    const result = await pool.query(
      `UPDATE approvals
       SET status = 'Rejected', remarks = $1, acted_at = NOW()
       WHERE id = $2 AND status = 'Pending'
       RETURNING *`,
      [remarks || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pending approval not found' });
    }

    await addLog('Approval rejected', `Approval #${req.params.id} was rejected.`, req.session?.user?.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not reject approval' });
  }
}

module.exports = {
  getApprovals,
  getApprovalById,
  createApproval,
  approveApproval,
  rejectApproval
};
