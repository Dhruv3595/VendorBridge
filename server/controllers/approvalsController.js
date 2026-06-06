const pool = require('../db/db');

async function addLog(action, description, userId, client) {
  const db = client || pool;
  await db.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

function approvalScope(req, values, alias = 'a') {
  if (req.user.role !== 'Manager') return '';

  values.push(req.user.id);
  return ` AND ${alias}.approver_id = $${values.length}`;
}

async function getApprovals(req, res) {
  const values = [];
  const scope = req.user.role === 'Manager'
    ? `WHERE a.approver_id = $${values.push(req.user.id)}`
    : '';

  try {
    const result = await pool.query(
      `SELECT a.*,
              u.name AS approver_name,
              q.status AS quotation_status,
              q.tax_percent,
              q.submitted_at,
              v.name AS vendor_name,
              r.title AS rfq_title,
              r.id AS rfq_id,
              CONCAT('RFQ-', TO_CHAR(r.created_at, 'YYYY'), '-', LPAD(r.id::TEXT, 3, '0')) AS rfq_number,
              sub.officer_name AS submitted_by,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * (1 + q.tax_percent / 100) AS grand_total
       FROM approvals a
       LEFT JOIN users u ON a.approver_id = u.id
       JOIN quotations q ON a.quotation_id = q.id
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       LEFT JOIN (
         SELECT id, name AS officer_name FROM users WHERE role IN ('Officer','Admin')
       ) sub ON sub.id = r.created_by
       ${scope}
       GROUP BY a.id, u.name, q.status, q.tax_percent, q.submitted_at,
                v.name, r.title, r.id, r.created_at, r.created_by, sub.officer_name
       ORDER BY a.id DESC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load approvals' });
  }
}

async function getApprovalById(req, res) {
  const values = [req.params.id];
  const scope = approvalScope(req, values);

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
       WHERE a.id = $1 ${scope}
       GROUP BY a.id, u.name, v.name, r.title, r.id, q.tax_percent, q.notes`,
      values
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

    await addLog('Approval created', `Approval #${result.rows[0].id} created for quotation #${quotation_id}.`, req.user.id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create approval' });
  }
}

async function approveApproval(req, res) {
  const { remarks } = req.body;

  if (!remarks || !remarks.trim()) {
    return res.status(400).json({ message: 'Approval remarks are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE approvals
       SET status = 'Approved', remarks = $1, acted_at = NOW(),
           approver_id = COALESCE(approver_id, $3)
       WHERE id = $2 AND status = 'Pending'
         AND (approver_id = $3 OR approver_id IS NULL)
       RETURNING *`,
      [remarks, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pending approval not found' });
    }

    const approval = result.rows[0];
    const pendingCheck = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM approvals
       WHERE quotation_id = $1 AND status = 'Pending'`,
      [approval.quotation_id]
    );

    if (pendingCheck.rows[0].count === 0) {
      await client.query(
        `UPDATE rfqs r
         SET status = 'Approved'
         FROM quotations q
         WHERE q.id = $1 AND r.id = q.rfq_id`,
        [approval.quotation_id]
      );

      const poResult = await client.query(
        `INSERT INTO purchase_orders (rfq_id, quotation_id, po_number, status)
         SELECT q.rfq_id, q.id, 'PO-TEMP-' || q.id::TEXT, 'Generated'
         FROM quotations q
         WHERE q.id = $1
           AND NOT EXISTS (SELECT 1 FROM purchase_orders po WHERE po.quotation_id = q.id)
         RETURNING *`,
        [approval.quotation_id]
      );

      if (poResult.rows.length > 0) {
        const po = poResult.rows[0];
        const year = new Date().getFullYear();
        const poNumber = `PO-${year}-${String(po.id).padStart(5, '0')}`;

        await client.query('UPDATE purchase_orders SET po_number = $1 WHERE id = $2', [poNumber, po.id]);
        await client.query('UPDATE rfqs SET status = $1 WHERE id = $2', ['PO Generated', po.rfq_id]);
        await addLog('PO generated', `Purchase Order ${poNumber} created for quotation #${approval.quotation_id}.`, req.user.id, client);
      }
    }

    await addLog('Approval approved', `Approval #${req.params.id} was approved.`, req.user.id, client);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not approve' });
  } finally {
    client.release();
  }
}

async function rejectApproval(req, res) {
  const { remarks } = req.body;

  if (!remarks || !remarks.trim()) {
    return res.status(400).json({ message: 'Rejection remarks are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE approvals
       SET status = 'Rejected', remarks = $1, acted_at = NOW(),
           approver_id = COALESCE(approver_id, $3)
       WHERE id = $2 AND status = 'Pending'
         AND (approver_id = $3 OR approver_id IS NULL)
       RETURNING *`,
      [remarks, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pending approval not found' });
    }

    await client.query(
      `UPDATE rfqs r
       SET status = 'Rejected'
       FROM quotations q
       WHERE q.id = $1 AND r.id = q.rfq_id`,
      [result.rows[0].quotation_id]
    );

    await addLog('Approval rejected', `Approval #${req.params.id} was rejected with remarks.`, req.user.id, client);
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not reject approval' });
  } finally {
    client.release();
  }
}

module.exports = {
  getApprovals,
  getApprovalById,
  createApproval,
  approveApproval,
  rejectApproval
};
