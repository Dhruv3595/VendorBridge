const pool = require('../db/db');

async function addLog(action, description, userId, client) {
  const db = client || pool;
  await db.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

async function getQuotations(req, res) {
  const values = [];
  const where = [];

  if (req.user.role === 'Vendor') {
    values.push(req.user.vendorId || 0);
    where.push(`q.vendor_id = $${values.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT q.*,
              v.name AS vendor_name,
              r.title AS rfq_title,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * (1 + q.tax_percent / 100) AS grand_total,
              MAX(qi.delivery_days) AS max_delivery_days
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       JOIN rfqs r ON q.rfq_id = r.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       GROUP BY q.id, v.name, r.title
       ORDER BY q.submitted_at DESC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load quotations' });
  }
}

async function getQuotationsByRfq(req, res) {
  const values = [req.params.rfqId];
  let scope = '';

  if (req.user.role === 'Vendor') {
    values.push(req.user.vendorId || 0);
    scope = ` AND q.vendor_id = $${values.length}`;
  }

  try {
    // When Admin/Officer fetches quotations for an RFQ, advance its status to Under Comparison
    if (['Admin', 'Officer'].includes(req.user.role)) {
      await pool.query(
        `UPDATE rfqs SET status = 'Under Comparison'
         WHERE id = $1 AND status = 'Quotation Received'`,
        [req.params.rfqId]
      );
    }

    const result = await pool.query(
      `SELECT q.*,
              v.name AS vendor_name,
              v.email AS vendor_email,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * q.tax_percent / 100 AS tax_amount,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * (1 + q.tax_percent / 100) AS grand_total,
              MAX(qi.delivery_days) AS max_delivery_days
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       WHERE q.rfq_id = $1 ${scope}
       GROUP BY q.id, v.name, v.email
       ORDER BY q.submitted_at ASC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load quotations' });
  }
}

async function getQuotationById(req, res) {
  const values = [req.params.id];
  let scope = '';

  if (req.user.role === 'Vendor') {
    values.push(req.user.vendorId || 0);
    scope = ` AND q.vendor_id = $${values.length}`;
  }

  try {
    const quotationResult = await pool.query(
      `SELECT q.*, v.name AS vendor_name, v.email AS vendor_email
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       WHERE q.id = $1 ${scope}`,
      values
    );

    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id',
      [req.params.id]
    );

    res.json({ ...quotationResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load quotation' });
  }
}

async function createQuotation(req, res) {
  const { rfq_id, tax_percent, notes, items = [] } = req.body;
  const vendorId = req.user.vendorId;

  if (!rfq_id || !vendorId || items.length === 0) {
    return res.status(400).json({ message: 'rfq_id and at least one item are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const rfqCheck = await client.query(
      `SELECT r.*
       FROM rfqs r
       JOIN rfq_vendors rv ON rv.rfq_id = r.id
       WHERE r.id = $1
         AND rv.vendor_id = $2
         AND r.status IN ('Published', 'Quotation Received')
         AND (r.deadline IS NULL OR r.deadline >= CURRENT_DATE)`,
      [rfq_id, vendorId]
    );

    if (rfqCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'RFQ is not assigned, open, or within deadline' });
    }

    const duplicate = await client.query(
      'SELECT id FROM quotations WHERE rfq_id = $1 AND vendor_id = $2',
      [rfq_id, vendorId]
    );

    if (duplicate.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'A quotation already exists for this RFQ' });
    }

    const qResult = await client.query(
      `INSERT INTO quotations (rfq_id, vendor_id, tax_percent, notes, status)
       VALUES ($1, $2, $3, $4, 'Draft')
       RETURNING *`,
      [rfq_id, vendorId, tax_percent || 0, notes || null]
    );
    const quotation = qResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, delivery_days)
         VALUES ($1, $2, $3, $4, $5)`,
        [quotation.id, item.item_name, item.quantity, item.unit_price, item.delivery_days || null]
      );
    }

    await client.query(
      `UPDATE rfqs
       SET status = 'Quotation Received'
       WHERE id = $1 AND status = 'Published'`,
      [rfq_id]
    );

    await addLog('Quotation draft created', `Vendor quotation #${quotation.id} created for RFQ #${rfq_id}.`, req.user.id, client);

    await client.query('COMMIT');
    res.status(201).json(quotation);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not create quotation' });
  } finally {
    client.release();
  }
}

async function updateQuotation(req, res) {
  const { tax_percent, notes, items = [] } = req.body;
  const client = await pool.connect();

  try {
    const existing = await client.query(
      `SELECT q.*, r.deadline
       FROM quotations q
       JOIN rfqs r ON q.rfq_id = r.id
       WHERE q.id = $1 AND q.vendor_id = $2`,
      [req.params.id, req.user.vendorId || 0]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (existing.rows[0].status !== 'Draft') {
      return res.status(400).json({ message: 'Only draft quotations can be edited' });
    }

    if (existing.rows[0].deadline && new Date(existing.rows[0].deadline) < new Date()) {
      return res.status(400).json({ message: 'Quotation deadline has passed' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE quotations SET tax_percent = $1, notes = $2 WHERE id = $3 RETURNING *',
      [tax_percent ?? existing.rows[0].tax_percent, notes ?? existing.rows[0].notes, req.params.id]
    );

    await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [req.params.id]);

    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, delivery_days)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.id, item.item_name, item.quantity, item.unit_price, item.delivery_days || null]
      );
    }

    await addLog('Quotation updated', `Quotation #${req.params.id} was updated.`, req.user.id, client);
    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not update quotation' });
  } finally {
    client.release();
  }
}

async function submitQuotation(req, res) {
  try {
    const result = await pool.query(
      `UPDATE quotations q
       SET status = 'Submitted', submitted_at = NOW()
       FROM rfqs r
       WHERE q.id = $1
         AND q.rfq_id = r.id
         AND q.vendor_id = $2
         AND q.status = 'Draft'
         AND (r.deadline IS NULL OR r.deadline >= CURRENT_DATE)
       RETURNING q.*`,
      [req.params.id, req.user.vendorId || 0]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Editable draft quotation not found' });
    }

    await addLog('Quotation submitted', `Quotation #${req.params.id} was submitted.`, req.user.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not submit quotation' });
  }
}

async function selectQuotation(req, res) {
  const { approver_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const selectedResult = await client.query(
      `UPDATE quotations
       SET status = 'Selected'
       WHERE id = $1 AND status = 'Submitted'
       RETURNING *`,
      [req.params.id]
    );

    if (selectedResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Only submitted quotations can be selected' });
    }

    const quotation = selectedResult.rows[0];

    await client.query(
      `UPDATE quotations
       SET status = 'Not Selected'
       WHERE rfq_id = $1 AND id <> $2 AND status = 'Submitted'`,
      [quotation.rfq_id, quotation.id]
    );

    await client.query('UPDATE rfqs SET status = $1 WHERE id = $2', ['Approval Pending', quotation.rfq_id]);

    const approverResult = approver_id
      ? { rows: [{ id: approver_id }] }
      : await client.query("SELECT id FROM users WHERE role = 'Manager' ORDER BY id LIMIT 1");

    const approvalResult = await client.query(
      `INSERT INTO approvals (quotation_id, approver_id, level, status)
       VALUES ($1, $2, 1, 'Pending')
       RETURNING *`,
      [quotation.id, approverResult.rows[0]?.id || null]
    );

    await addLog(
      'Quotation selected',
      `Quotation #${quotation.id} selected for RFQ #${quotation.rfq_id}; approval #${approvalResult.rows[0].id} created.`,
      req.user.id,
      client
    );

    await client.query('COMMIT');
    res.json({ quotation, approval: approvalResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not select quotation' });
  } finally {
    client.release();
  }
}

async function withdrawQuotation(req, res) {
  try {
    const result = await pool.query(
      `UPDATE quotations
       SET status = 'Withdrawn'
       WHERE id = $1
         AND vendor_id = $2
         AND status = 'Submitted'
       RETURNING *`,
      [req.params.id, req.user.vendorId || 0]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submitted quotation not found or already processed' });
    }

    await addLog('Quotation withdrawn', `Quotation #${req.params.id} was withdrawn by vendor.`, req.user.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not withdraw quotation' });
  }
}

module.exports = {
  getQuotations,
  getQuotationsByRfq,
  getQuotationById,
  createQuotation,
  updateQuotation,
  submitQuotation,
  selectQuotation,
  withdrawQuotation
};
