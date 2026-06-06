const pool = require('../db/db');

// Reusable activity logger
async function addLog(action, description, userId) {
  await pool.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

// GET /api/quotations/rfq/:rfqId — all quotations for an RFQ (comparison view)
async function getQuotationsByRfq(req, res) {
  try {
    const { rfqId } = req.params;

    const result = await pool.query(
      `SELECT q.*, v.name AS vendor_name, v.email AS vendor_email,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) AS subtotal,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * q.tax_percent / 100 AS tax_amount,
              COALESCE(SUM(qi.quantity * qi.unit_price), 0) * (1 + q.tax_percent / 100) AS grand_total,
              MAX(qi.delivery_days) AS max_delivery_days
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
       WHERE q.rfq_id = $1
       GROUP BY q.id, v.name, v.email
       ORDER BY q.submitted_at ASC`,
      [rfqId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load quotations' });
  }
}

// GET /api/quotations/:id — single quotation with its line items
async function getQuotationById(req, res) {
  try {
    const quotationResult = await pool.query(
      `SELECT q.*, v.name AS vendor_name, v.email AS vendor_email
       FROM quotations q
       JOIN vendors v ON q.vendor_id = v.id
       WHERE q.id = $1`,
      [req.params.id]
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

// POST /api/quotations — vendor submits a new quotation
async function createQuotation(req, res) {
  const { rfq_id, vendor_id, tax_percent, notes, items = [] } = req.body;

  if (!rfq_id || !vendor_id || items.length === 0) {
    return res.status(400).json({ message: 'rfq_id, vendor_id, and at least one item are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert the quotation header
    const qResult = await client.query(
      `INSERT INTO quotations (rfq_id, vendor_id, tax_percent, notes, status)
       VALUES ($1, $2, $3, $4, 'Draft')
       RETURNING *`,
      [rfq_id, vendor_id, tax_percent || 0, notes || null]
    );
    const quotation = qResult.rows[0];

    // Insert each line item
    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, delivery_days)
         VALUES ($1, $2, $3, $4, $5)`,
        [quotation.id, item.item_name, item.quantity, item.unit_price, item.delivery_days || null]
      );
    }

    await client.query('COMMIT');

    await addLog('Quotation created', `Quotation #${quotation.id} created for RFQ #${rfq_id}.`, req.session?.user?.id);
    res.status(201).json(quotation);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not create quotation' });
  } finally {
    client.release();
  }
}

// PUT /api/quotations/:id — update a draft quotation
async function updateQuotation(req, res) {
  const { tax_percent, notes, items = [] } = req.body;

  const client = await pool.connect();

  try {
    // Only allow editing drafts
    const existing = await client.query('SELECT * FROM quotations WHERE id = $1', [req.params.id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (existing.rows[0].status !== 'Draft') {
      return res.status(400).json({ message: 'Only draft quotations can be edited' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE quotations SET tax_percent = $1, notes = $2 WHERE id = $3 RETURNING *',
      [tax_percent ?? existing.rows[0].tax_percent, notes ?? existing.rows[0].notes, req.params.id]
    );

    // Replace all items
    await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [req.params.id]);

    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, item_name, quantity, unit_price, delivery_days)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.id, item.item_name, item.quantity, item.unit_price, item.delivery_days || null]
      );
    }

    await client.query('COMMIT');

    await addLog('Quotation updated', `Quotation #${req.params.id} was updated.`, req.session?.user?.id);
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not update quotation' });
  } finally {
    client.release();
  }
}

// PATCH /api/quotations/:id/submit — change status from Draft to Submitted
async function submitQuotation(req, res) {
  try {
    const result = await pool.query(
      `UPDATE quotations SET status = 'Submitted', submitted_at = NOW()
       WHERE id = $1 AND status = 'Draft'
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Draft quotation not found' });
    }

    await addLog('Quotation submitted', `Quotation #${req.params.id} was submitted.`, req.session?.user?.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not submit quotation' });
  }
}

module.exports = {
  getQuotationsByRfq,
  getQuotationById,
  createQuotation,
  updateQuotation,
  submitQuotation
};
