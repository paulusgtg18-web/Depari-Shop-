const express = require('express');
const db = require('../db');
const { requireAuth, requireOwner } = require('../middleware/auth');

const router = express.Router();

// Publik: lihat semua kategori/jenis produk
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  res.json({ categories });
});

// Hanya pemilik: tambah jenis produk baru
router.post('/', requireAuth, requireOwner, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nama jenis produk wajib diisi.' });

  const exists = db.prepare('SELECT id FROM categories WHERE name = ?').get(name.trim());
  if (exists) return res.status(400).json({ error: 'Jenis produk ini sudah ada.' });

  const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name.trim());
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  res.json({ category });
});

// Hanya pemilik: hapus jenis produk
router.delete('/:id', requireAuth, requireOwner, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Jenis produk dihapus.' });
});

module.exports = router;
