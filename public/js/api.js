// Helper untuk memanggil API backend & mengelola sesi login di browser

const API = {
  token() { return localStorage.getItem('ds_token'); },
  user() {
    const raw = localStorage.getItem('ds_user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem('ds_token', token);
    localStorage.setItem('ds_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('ds_token');
    localStorage.removeItem('ds_user');
  },
  async request(path, { method = 'GET', body, isForm = false } = {}) {
    const headers = {};
    const token = this.token();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isForm) headers['Content-Type'] = 'application/json';

    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan. Coba lagi.');
    return data;
  },
};

function renderNavbar(activePage = '') {
  const user = API.user();
  const nav = document.getElementById('navbar-root');
  if (!nav) return;

  let actions = '';
  if (user) {
    const initial = user.name ? user.name.trim()[0].toUpperCase() : '?';
    actions = `
      <div class="profile-wrap">
        <button class="profile-btn" id="profileBtn">
          <span class="avatar">${initial}</span>
          <span>${user.name}</span>
        </button>
        <div class="dropdown" id="profileDropdown">
          <a href="/profile.html">Profil saya</a>
          ${user.is_owner ? '<a href="/profile.html#kelola">Kelola produk</a>' : ''}
          <div class="bar"></div>
          <button class="logout" id="logoutBtn">Keluar (Logout)</button>
        </div>
      </div>`;
  } else {
    actions = `
      <a href="/login.html" class="btn btn-outline">Masuk</a>
      <a href="/register.html" class="btn btn-gold">Daftar</a>`;
  }

  nav.innerHTML = `
    <nav class="navbar">
      <div class="container">
        <a href="/index.html" class="brand"><span class="tag"></span><span class="txt">Depari Shop</span></a>
        <div class="nav-actions">${actions}</div>
      </div>
    </nav>`;

  if (user) {
    const btn = document.getElementById('profileBtn');
    const dd = document.getElementById('profileDropdown');
    btn.addEventListener('click', () => dd.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !dd.contains(e.target)) dd.classList.remove('open');
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
      API.clearSession();
      window.location.href = '/index.html';
    });
  }
}

function formatRupiah(num) {
  return 'Rp' + Number(num || 0).toLocaleString('id-ID');
}

function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `alert show alert-${type}`;
      }
