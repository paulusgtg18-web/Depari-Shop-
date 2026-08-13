const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendResetPasswordEmail(toEmail, resetLink) {
  const t = getTransporter();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2>Reset Password - Depari Shop</h2>
      <p>Kami menerima permintaan untuk mengatur ulang password akun kamu.</p>
      <p>Klik tombol di bawah ini untuk membuat password baru. Link ini berlaku selama 1 jam.</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${resetLink}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a>
      </p>
      <p>Kalau kamu tidak meminta ini, abaikan saja email ini.</p>
    </div>
  `;

  if (!t) {
    // Tidak ada konfigurasi SMTP -> tampilkan link di console (mode pengembangan)
    console.log('\n[DEV MODE] SMTP belum dikonfigurasi. Link reset password:');
    console.log(resetLink, '\n');
    return { devMode: true };
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'Reset Password - Depari Shop',
    html,
  });
  return { devMode: false };
}

module.exports = { sendResetPasswordEmail };
