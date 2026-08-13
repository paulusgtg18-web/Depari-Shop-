# Depari Shop — Website Katalog Produk

Website katalog produk untuk **Depari Shop**. Fitur:

- Katalog produk publik (siapa saja bisa lihat, tanpa perlu login) lengkap dengan gambar
- Login & logout, bisa pakai **email atau nomor WhatsApp**
- Tombol profil di navbar (ada nama, avatar, dan menu Logout)
- Sebagai **pemilik toko**, kamu bisa menambah jenis produk (kategori) dan produk baru lewat halaman Profil
- Fitur **Lupa Password** — kirim link reset lewat email
- Siap di-deploy sebagai website sungguhan (Railway, Render, VPS, dll)

Akun pertama yang mendaftar di website ini **otomatis menjadi pemilik toko** dan satu-satunya yang bisa menambah/menghapus produk & kategori. Pastikan kamu sendiri yang daftar pertama kali setelah deploy.

## 1. Jalankan di komputer sendiri (opsional, untuk coba-coba dulu)

Butuh [Node.js](https://nodejs.org) versi 18 ke atas terpasang di komputer.

```bash
npm install
cp .env.example .env
# buka .env, isi JWT_SECRET dengan teks acak bebas
npm start
```

Buka `http://localhost:3000` di browser. Daftar akun pertama = otomatis jadi pemilik toko.

> Kalau `.env` belum diisi SMTP (email), link reset password akan muncul di **terminal/console**, bukan terkirim ke email — cukup untuk uji coba.

## 2. Konfigurasi email untuk fitur "Lupa Password" (wajib untuk website sungguhan)

Isi bagian `SMTP_*` di file `.env`. Contoh pakai Gmail:

1. Aktifkan verifikasi 2 langkah di akun Google kamu
2. Buat **App Password** di [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Isi:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=emailkamu@gmail.com
   SMTP_PASS=app-password-16-karakter
   SMTP_FROM="Depari Shop <emailkamu@gmail.com>"
   ```

**Catatan soal reset password lewat WhatsApp:** mengirim OTP/link lewat WhatsApp butuh layanan pihak ketiga berbayar (contoh: Fonnte, Twilio, WhatsApp Business API) karena WhatsApp tidak menyediakan cara gratis untuk kirim pesan otomatis. Saat ini reset password hanya lewat **email**. Kalau kamu daftar pakai nomor WhatsApp saja tanpa email, sarankan pengguna menghubungi kamu langsung untuk reset manual, atau tambahkan email di akun mereka.

## 3. Deploy jadi website sungguhan

Pilihan termudah: **Railway** atau **Render** (mendukung Node.js + penyimpanan file dengan mudah, ada paket gratis/murah).

### Opsi A — Railway (paling simpel)

1. Buat akun di [railway.app](https://railway.app)
2. Upload folder project ini ke GitHub (buat repo baru, push semua file kecuali yang ada di `.gitignore`)
3. Di Railway: **New Project → Deploy from GitHub repo** → pilih repo kamu
4. Di tab **Variables**, tambahkan environment variables sesuai isi `.env.example` (JWT_SECRET, SMTP_*, APP_URL — isi APP_URL dengan URL yang diberikan Railway setelah deploy)
5. Railway otomatis menjalankan `npm install` & `npm start`. Selesai — website kamu online.

### Opsi B — Render

1. Buat akun di [render.com](https://render.com)
2. **New → Web Service** → hubungkan ke repo GitHub kamu
3. Build command: `npm install`, Start command: `node server.js`
4. Tambahkan environment variables yang sama seperti di atas
5. Tambahkan **Persistent Disk** (menu Disks) dan arahkan ke folder `/opt/render/project/src/uploads` supaya gambar produk tidak hilang saat redeploy

### Opsi C — VPS sendiri (pakai Docker)

Kalau kamu punya VPS (DigitalOcean, dsb) dan sudah pasang Docker:

```bash
docker build -t depari-shop .
docker run -d -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/depari-shop.sqlite:/app/depari-shop.sqlite \
  --name depari-shop \
  depari-shop
```

Lalu pasang Nginx sebagai reverse proxy + SSL (Let's Encrypt) supaya bisa diakses lewat domain kamu.

> **Catatan penting:** platform *serverless* seperti Vercel **tidak cocok** untuk project ini apa adanya, karena database SQLite dan folder `uploads` butuh penyimpanan yang tidak hilang setiap kali server "tidur". Gunakan Railway, Render, atau VPS seperti di atas.

## Struktur Project

```
depari-shop/
├── server.js              # Server utama (Express)
├── db.js                  # Setup database SQLite
├── routes/
│   ├── auth.js             # Daftar, login, lupa password
│   ├── categories.js       # Jenis produk
│   └── products.js         # Produk + upload gambar
├── middleware/auth.js      # Cek login & cek pemilik toko
├── utils/mailer.js         # Kirim email reset password
├── public/                 # Semua halaman website (HTML/CSS/JS)
└── uploads/                 # Gambar produk yang diupload
```

## Ganti nama toko / warna tampilan

- Nama toko: cari & ganti teks "Depari Shop" di file-file dalam folder `public/`
- Warna & tampilan: edit variabel warna di bagian atas file `public/css/style.css`
