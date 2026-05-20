// routes/auth.js — Secure Admin Authentication
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

// ─── ADMIN LOGIN ──────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Check username
    if (username !== process.env.ADMIN_USERNAME) {
      logLoginAttempt(req, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Check password (bcrypt compare)
    const validPassword = await bcrypt.compare(
      password,
      // Hash stored in env or DB — for simplicity hashing on-the-fly here
      await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
    );

    // Simple direct compare for demo (use hashed password in production)
    const directMatch = (password === process.env.ADMIN_PASSWORD);

    if (!directMatch) {
      logLoginAttempt(req, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { role: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // 4. Set secure HTTP-only cookie
    res.cookie('adminToken', token, {
      httpOnly: true,     // JS cannot access — XSS protection
      secure:   process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'strict', // CSRF protection
      maxAge:   8 * 60 * 60 * 1000 // 8 hours
    });

    logLoginAttempt(req, true);
    res.json({ success: true, message: 'Login successful' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOGOUT ───────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true });
});

// ─── VERIFY SESSION ───────────────────────
router.get('/verify', (req, res) => {
  const token = req.cookies.adminToken;
  if (!token) return res.status(401).json({ valid: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, username: decoded.username });
  } catch {
    res.status(401).json({ valid: false });
  }
});

// ─── IP TRACKING ──────────────────────────
const loginLogs = []; // In production: save to MongoDB
function logLoginAttempt(req, success) {
  const ip = req.ip || req.connection.remoteAddress;
  const log = { ip, success, time: new Date().toISOString(), ua: req.headers['user-agent'] };
  loginLogs.push(log);
  console.log(`${success ? '✅' : '❌'} Login attempt from IP: ${ip} — ${success ? 'SUCCESS' : 'FAILED'}`);
}

// ─── VIEW LOGIN LOGS (Admin only) ─────────
router.get('/logs', require('../middleware/auth'), (req, res) => {
  res.json(loginLogs.slice(-50)); // Last 50 attempts
});

module.exports = router;
