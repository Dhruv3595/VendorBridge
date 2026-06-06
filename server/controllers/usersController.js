const bcrypt = require('bcryptjs');
const pool = require('../db/db');

function cleanUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    organization_id: row.organization_id,
    vendor_id: row.vendor_id,
    phone: row.phone,
    country: row.country,
    status: row.status,
    created_at: row.created_at
  };
}

async function addLog(action, description, userId) {
  await pool.query(
    'INSERT INTO activity_logs (action, description, user_id) VALUES ($1, $2, $3)',
    [action, description, userId || null]
  );
}

async function getUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, organization_id, vendor_id, phone, country, status, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load users' });
  }
}

async function createUser(req, res) {
  const { name, email, role, phone, country, password, vendor_id } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: 'Name, email, role and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, country, vendor_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')
       RETURNING id, name, email, role, organization_id, vendor_id, phone, country, status, created_at`,
      [name, email, passwordHash, role, phone || null, country || null, role === 'Vendor' ? vendor_id || null : null]
    );

    await addLog('User created', `${result.rows[0].name} was created as ${result.rows[0].role}.`, req.user.id);
    res.status(201).json(cleanUser(result.rows[0]));
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Could not create user' });
  }
}

async function updateUserStatus(req, res) {
  const { status } = req.body;
  const allowed = ['Active', 'Pending', 'Blocked'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Status must be Active, Pending, or Blocked' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET status = $1
       WHERE id = $2
       RETURNING id, name, email, role, organization_id, vendor_id, phone, country, status, created_at`,
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await addLog('User status changed', `${result.rows[0].name} is now ${status}.`, req.user.id);
    res.json(cleanUser(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not update user status' });
  }
}

async function updateUser(req, res) {
  const { name, email, role, phone, country, vendor_id, status, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email and role are required' });
  }

  try {
    let query, params;
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      query = `UPDATE users
               SET name = $1, email = $2, role = $3, phone = $4, country = $5,
                   vendor_id = $6, status = $7, password_hash = $8
               WHERE id = $9
               RETURNING id, name, email, role, organization_id, vendor_id, phone, country, status, created_at`;
      params = [name, email, role, phone || null, country || null,
        role === 'Vendor' ? vendor_id || null : null,
        status || 'Active', passwordHash, req.params.id];
    } else {
      query = `UPDATE users
               SET name = $1, email = $2, role = $3, phone = $4, country = $5,
                   vendor_id = $6, status = $7
               WHERE id = $8
               RETURNING id, name, email, role, organization_id, vendor_id, phone, country, status, created_at`;
      params = [name, email, role, phone || null, country || null,
        role === 'Vendor' ? vendor_id || null : null,
        status || 'Active', req.params.id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await addLog('User updated', `${result.rows[0].name} was updated.`, req.user.id);
    res.json(cleanUser(result.rows[0]));
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Could not update user' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus
};
