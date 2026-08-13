const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'depari-shop.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  is_owner INTEGER NOT NULL DEFAULT 0,
  avatar_path TEXT,
  reset_token TEXT,
  reset_token_expiry INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  image_path TEXT,
  category_id INTEGER,
  whatsapp_number TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
`);

// Migrasi ringan: kalau database lama sudah ada dari sebelum kolom whatsapp_number
// ditambahkan, CREATE TABLE IF NOT EXISTS di atas tidak akan menambah kolomnya.
// Blok ini menambahkannya secara aman kalau belum ada.
const productColumns = db.prepare(`PRAGMA table_info(products)`).all();
const hasWhatsapp = productColumns.some(col => col.name === 'whatsapp_number');
if (!hasWhatsapp) {
  db.exec(`ALTER TABLE products ADD COLUMN whatsapp_number TEXT;`);
}

const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
const hasAvatar = userColumns.some(col => col.name === 'avatar_path');
if (!hasAvatar) {
  db.exec(`ALTER TABLE users ADD COLUMN avatar_path TEXT;`);
}

module.exports = db;
