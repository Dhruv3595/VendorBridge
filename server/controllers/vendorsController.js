const pool = require('../db/db');

async function addLog(action, description, userId) {
  await pool.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

async function getVendors(req, res) {
  const { search, status } = req.query;
  const values = [];
  const where = [];

  if (search) {
    values.push(`%${search}%`);
    where.push(`(name ILIKE $${values.length} OR gst_number ILIKE $${values.length} OR category ILIKE $${values.length})`);
  }

  if (status && status !== 'All') {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  try {
    const query = `
      SELECT *
      FROM vendors
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load vendors' });
  }
}

async function getVendorById(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load vendor' });
  }
}

async function createVendor(req, res) {
  const { name, category, gst_number, contact_person, phone, email, address, status } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO vendors (name, category, gst_number, contact_person, phone, email, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, category, gst_number, contact_person, phone, email, address, status || 'Active']
    );

    const vendor = result.rows[0];
    await addLog('Vendor created', `${vendor.name} was added.`, req.user.id);
    res.status(201).json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not create vendor' });
  }
}

async function updateVendor(req, res) {
  const { name, category, gst_number, contact_person, phone, email, address, status } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE vendors
       SET name = $1,
           category = $2,
           gst_number = $3,
           contact_person = $4,
           phone = $5,
           email = $6,
           address = $7,
           status = $8
       WHERE id = $9
       RETURNING *`,
      [name, category, gst_number, contact_person, phone, email, address, status || 'Active', req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = result.rows[0];
    await addLog('Vendor updated', `${vendor.name} was updated.`, req.user.id);
    res.json(vendor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update vendor' });
  }
}

async function updateVendorStatus(req, res) {
  try {
    const current = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);

    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const nextStatus = current.rows[0].status === 'Active' ? 'Blocked' : 'Active';
    const result = await pool.query(
      'UPDATE vendors SET status = $1 WHERE id = $2 RETURNING *',
      [nextStatus, req.params.id]
    );

    await addLog('Vendor status changed', `${result.rows[0].name} is now ${nextStatus}.`, req.user.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update vendor status' });
  }
}

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  updateVendorStatus
};
