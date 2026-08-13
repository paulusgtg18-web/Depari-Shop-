const jwt = require('jsonwebtoken');
const db = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Kamu harus login terlebih dahulu.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, phone, is_owner FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'Akun tidak ditemukan.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi login tidak valid atau sudah kedaluwarsa.' });
  }
}

function requireOwner(req, res, next) {
  if (!req.user || !req.user.is_owner) {
    return res.status(403).json({ error: 'Hanya pemilik toko yang boleh melakukan ini.' });
  }
  next();
}

module.exports = { requireAuth, requireOwner };
