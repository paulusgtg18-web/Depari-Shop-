const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth, requireOwner } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString('hex') + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.'));
  },
});

// Publik: lihat semua produk (bisa difilter per kategori)
router.get('/', (req, res) => {
  const { category } = req.query;
  let products;
  if (category) {
    products = db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = ? ORDER BY p.created_at DESC`
    ).all(category);
  } else {
    products = db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    ).all();
  }
  res.json({ products });
});

// Hanya pemilik: tambah produk baru + gambar
router.post('/', requireAuth, requireOwner, upload.single('image'), (req, res) => {
  const { name, description, price, category_id } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });

  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  const info = db.prepare(
    'INSERT INTO products (name, description, price, image_path, category_id) VALUES (?, ?, ?, ?, ?)'
  ).run(name, description || '', Number(price), image_path, category_id || null);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.json({ product });
});

// Hanya pemilik: ubah produk
router.put('/:id', requireAuth, requireOwner, upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const { name, description, price, category_id } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : existing.image_path;

  db.prepare(
    'UPDATE products SET name = ?, description = ?, price = ?, image_path = ?, category_id = ? WHERE id = ?'
  ).run(
    name || existing.name,
    description ?? existing.description,
    price ? Number(price) : existing.price,
    image_path,
    category_id || existing.category_id,
    req.params.id
  );

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product });
});

// Hanya pemilik: hapus produk
router.delete('/:id', requireAuth, requireOwner, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Produk dihapus.' });
});

module.exports = router;
