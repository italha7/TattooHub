// middleware/auth.js — JWT Verification Middleware
const jwt = require('jsonwebtoken');

module.exports = function requireAdmin(req, res, next) {
  // Get token from secure cookie
  const token = req.cookies.adminToken;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.clearCookie('adminToken');
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }
};
