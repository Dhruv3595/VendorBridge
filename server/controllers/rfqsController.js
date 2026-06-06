const pool = require('../db/db');

async function addLog(action, description, userId) {
  await pool.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

async function getRfqs(req, res) {
  try {
    const result = await pool.query(
      `SELECT r.*,
              COUNT(rv.vendor_id)::int AS assigned_vendor_count
       FROM rfqs r
       LEFT JOIN rfq_vendors rv ON r.id = rv.rfq_id
       GROUP BY r.id
       ORDER BY r.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load RFQs' });
  }
}

async function getRfqById(req, res) {
  try {
    const rfqResult = await pool.query('SELECT * FROM rfqs WHERE id = $1', [req.params.id]);

    if (rfqResult.rows.length === 0) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY id',
      [req.params.id]
    );
    const vendorsResult = await pool.query(
      `SELECT v.*
       FROM rfq_vendors rv
       JOIN vendors v ON rv.vendor_id = v.id
       WHERE rv.rfq_id = $1
       ORDER BY v.name`,
      [req.params.id]
    );

    res.json({
      ...rfqResult.rows[0],
      items: itemsResult.rows,
      vendors: vendorsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load RFQ' });
  }
}

async function createRfq(req, res) {
  const { title, category, deadline, description, items = [], vendorIds = [], status } = req.body;

  if (!title || items.length === 0) {
    return res.status(400).json({ message: 'Title and at least one line item are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const rfqResult = await client.query(
      `INSERT INTO rfqs (title, category, deadline, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, category, deadline || null, description, status || 'Draft', req.session?.user?.id || null]
    );
    const rfq = rfqResult.rows[0];

    // Simple loops are enough here and easy to read.
    for (const item of items) {
      await client.query(
        `INSERT INTO rfq_items (rfq_id, item_name, quantity, unit)
         VALUES ($1, $2, $3, $4)`,
        [rfq.id, item.item_name || item.name, item.quantity || item.qty, item.unit]
      );
    }

    for (const vendorId of vendorIds) {
      await client.query(
        'INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [rfq.id, vendorId]
      );
    }

    await client.query(
      'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
      ['RFQ created', `${rfq.title} was created.`, req.session?.user?.id || null]
    );

    await client.query('COMMIT');
    res.status(201).json(rfq);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Could not create RFQ' });
  } finally {
    client.release();
  }
}

async function updateRfq(req, res) {
  const { title, category, deadline, description, status } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'RFQ title is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE rfqs
       SET title = $1,
           category = $2,
           deadline = $3,
           description = $4,
           status = $5
       WHERE id = $6
       RETURNING *`,
      [title, category, deadline || null, description, status || 'Draft', req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    await addLog('RFQ updated', `${result.rows[0].title} was updated.`, req.session?.user?.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update RFQ' });
  }
}

async function updateRfqStatus(req, res) {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE rfqs SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    await addLog('RFQ status changed', `${result.rows[0].title} is now ${status}.`, req.session?.user?.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update RFQ status' });
  }
}

module.exports = {
  getRfqs,
  getRfqById,
  createRfq,
  updateRfq,
  updateRfqStatus
};
