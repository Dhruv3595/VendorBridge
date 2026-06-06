const bcrypt = require('bcryptjs');
const pool = require('../db/db');

function cleanUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
    vendorId: user.vendor_id,
    phone: user.phone,
    country: user.country,
    photo_url: user.photo_url
  };
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    req.session.user = cleanUser(user);
    res.json({ user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
}

async function signup(req, res) {
  const { firstName, lastName, email, phone, role, country, password, vendorId } = req.body;
  const name = `${firstName || ''} ${lastName || ''}`.trim();

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, role and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, country, vendor_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, organization_id, vendor_id, phone, country, photo_url`,
      [name, email, passwordHash, role, phone, country, role === 'Vendor' ? vendorId || null : null]
    );

    req.session.user = cleanUser(result.rows[0]);
    res.status(201).json({ user: req.session.user });
  } catch (error) {
    console.error(error);

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    res.status(500).json({ message: 'Signup failed' });
  }
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = {
  login,
  signup,
  logout,
  me
};
