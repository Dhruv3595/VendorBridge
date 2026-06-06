const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
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
    photo_url: user.photo_url,
    status: user.status
  };
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getMailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
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
    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ message: `Account is ${user.status}` });
    }

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

// POST /api/auth/forgot-password  → send OTP
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    // Always respond the same way to avoid user enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, an OTP has been sent.' });
    }

    const otp = makeOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any previous OTPs for this email
    await pool.query('UPDATE password_reset_otps SET used = TRUE WHERE email = $1', [email]);

    await pool.query(
      'INSERT INTO password_reset_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );

    const transporter = getMailTransporter();
    await transporter.sendMail({
      from: `"VendorBridge" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'VendorBridge — Your Password Reset OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#714B67;margin-bottom:8px;">Password Reset</h2>
          <p style="color:#6b7280;margin-bottom:24px;">Use the OTP below to reset your VendorBridge password. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f5f3ff;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#714B67;">${otp}</span>
          </div>
          <p style="color:#9ca3af;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: 'If that email exists, an OTP has been sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not send OTP. Please try again.' });
  }
}

// POST /api/auth/verify-otp  → verify OTP only (returns a short-lived token in session)
async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

  try {
    const result = await pool.query(
      `SELECT * FROM password_reset_otps
       WHERE email = $1 AND otp = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark as used
    await pool.query('UPDATE password_reset_otps SET used = TRUE WHERE id = $1', [result.rows[0].id]);

    // Store a verified flag in session so reset-password step can trust it
    req.session.otpVerified = { email, at: Date.now() };

    res.json({ message: 'OTP verified' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not verify OTP' });
  }
}

// POST /api/auth/reset-password  → set new password
async function resetPassword(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and new password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  // Check session flag set by verifyOtp
  const verified = req.session.otpVerified;
  if (!verified || verified.email !== email || Date.now() - verified.at > 15 * 60 * 1000) {
    return res.status(403).json({ message: 'OTP not verified or session expired. Please start over.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [hash, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear the session flag
    delete req.session.otpVerified;

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not reset password' });
  }
}

module.exports = {
  login,
  signup,
  logout,
  me,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
