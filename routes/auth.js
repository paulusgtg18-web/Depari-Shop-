const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendResetPasswordEmail } = require('../utils/mailer');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone, is_owner: !!u.is_owner, avatar_path: u.avatar_path || null };
}

// Daftar akun baru. Akun pertama yang daftar otomatis jadi pemilik toko (owner).
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({ error: 'Nama, password, dan email atau nomor WhatsApp wajib diisi.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE (email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL)').get(email || null, phone || null);
  if (existing) {
    return res.status(400).json({ error: 'Email atau nomor WhatsApp sudah terdaftar.' });
  }

  const ownerCount = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_owner = 1').get().c;
  const isOwner = ownerCount === 0 ? 1 : 0;

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (name, email, phone, password_hash, is_owner) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email || null, phone || null, password_hash, isOwner);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// Login pakai email ATAU nomor WhatsApp
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/nomor WhatsApp dan password wajib diisi.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(identifier, identifier);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email/nomor WhatsApp atau password salah.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// Info user yang sedang login (dipakai halaman profil)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Upload / ganti foto profil
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'avatar-' + crypto.randomBytes(16).toString('hex') + ext);
  },
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.'));
  },
});

router.put('/avatar', requireAuth, uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Pilih gambar untuk diupload.' });

  const avatar_path = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar_path = ? WHERE id = ?').run(avatar_path, req.user.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

// Hapus foto profil (kembali ke avatar inisial)
router.delete('/avatar', requireAuth, (req, res) => {
  db.prepare('UPDATE users SET avatar_path = NULL WHERE id = ?').run(req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

// Minta link reset password (dikirim lewat email)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Masukkan email kamu.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Selalu balas sukses walau email tidak ditemukan, supaya tidak bocorkan data akun
  if (!user) {
    return res.json({ message: 'Jika email terdaftar, link reset password sudah dikirim.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 60 * 60 * 1000; // 1 jam
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(token, expiry, user.id);

  const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password.html?token=${token}`;
  try {
    await sendResetPasswordEmail(user.email, resetLink);
  } catch (err) {
    console.error('Gagal kirim email reset password:', err.message);
  }

  res.json({ message: 'Jika email terdaftar, link reset password sudah dikirim.' });
});

// Set password baru pakai token dari email
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Data tidak lengkap.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter.' });

  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user || !user.reset_token_expiry || user.reset_token_expiry < Date.now()) {
    return res.status(400).json({ error: 'Link reset password tidak valid atau sudah kedaluwarsa.' });
  }

  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?').run(password_hash, user.id);

  res.json({ message: 'Password berhasil diubah. Silakan login dengan password baru.' });
});

module.exports = router;
