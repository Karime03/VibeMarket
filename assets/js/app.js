/* =========================================================
   VibeMarket — Núcleo compartido (todas las páginas)
   Header, footer, carrito, wishlist, buscador, chatbot, toasts
   ========================================================= */

/* ---------- Iconos (SVG inline) ---------- */
const ICONS = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.7 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.3 0 5.5 3.1 4.3 6.3C19.5 15.4 12 20 12 20Z"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 10h8M8 13h5" stroke-linecap="round"/></svg>',
  send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 12 20 4l-6 16-3-7-7-1Z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="18" cy="17.5" r="1.8"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke-linecap="round"/></svg>',
  return: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h11a5 5 0 0 1 0 10H9"/><path d="m8 6-4 4 4 4"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 13 11"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="4" rx="1.5"/><rect x="3" y="10" width="18" height="4" rx="1.5"/><rect x="3" y="16" width="18" height="4" rx="1.5"/></svg>',
  filter: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 10 12 4l8 6v10H4V10Z"/><path d="M10 20v-6h4v6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z"/><path d="M10 21h4" stroke-linecap="round"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M11 8v6M8 11h6"/></svg>',
  eye: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
};

const LOGO_MARK = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 14 L20 29 L28 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="10.5" r="2.4" fill="#B8643F"/></svg>`;

/* ---------- Utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' MXN';
const moneyShort = n => '$' + Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });
const starStr = r => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
const qs = k => new URLSearchParams(location.search).get(k) ?? new URLSearchParams(location.hash.slice(1)).get(k);
/* Rutas robustas: algunos servidores locales (p. ej. "npx serve" con cleanUrls) borran la parte "?..." de la URL.
   Copiamos esos parámetros después del "#", que el navegador siempre conserva. */
const withHash = url => { const s = String(url); if (!s.includes('?') || s.includes('#') || /^(https?:|mailto:|tel:)/.test(s)) return s; return s + '#' + s.split('?')[1]; };
/** Navega después de terminar de guardar en la base de datos */
const navigate = async url => { await DB.flush(); location.href = withHash(url); };
document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a || a.target === '_blank' && /^https?:/.test(a.getAttribute('href'))) return; const h = a.getAttribute('href'); const w = withHash(h); if (w !== h) a.setAttribute('href', w); }, true);
const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const Cart = {
  items() { return Store.get('cart', []); },
  save(items) { Store.set('cart', items); updateBadges(); },
  add(id, color, size, qty = 1) {
    const u = Auth.user();
    if (u && u.role !== 'buyer') { toast(`Estás como ${ROLE_LABEL[u.role]}. Para comprar, entra con una cuenta de comprador.`); return false; }
    const p = getProduct(id); color = color || p.colors[0]; size = size || p.sizes[0];
    const stock = p.stock[`${color}|${size}`] ?? 0;
    const items = this.items();
    const ex = items.find(i => i.id === id && i.color === color && i.size === size);
    const current = ex ? ex.qty : 0;
    if (current + qty > stock) { toast(stock === 0 ? 'Variante agotada' : `Solo quedan ${stock} piezas disponibles`); return false; }
    if (ex) ex.qty += qty; else items.push({ id, color, size, qty });
    this.save(items);
    return true;
  },
  setQty(idx, qty) {
    const items = this.items(); const it = items[idx]; if (!it) return;
    const max = getProduct(it.id).stock[`${it.color}|${it.size}`];
    it.qty = Math.max(1, Math.min(qty, max));
    if (qty > max) toast(`Máximo disponible: ${max}`);
    this.save(items);
  },
  remove(idx) { const items = this.items(); items.splice(idx, 1); this.save(items); },
  clear() { this.save([]); },
  count() { return this.items().reduce((a, i) => a + i.qty, 0); },
  subtotal() { return this.items().reduce((a, i) => a + getProduct(i.id).price * i.qty, 0); },
};

const Wishlist = {
  ids() { const u = Auth.user(); return u && u.role === 'buyer' ? Store.get('wishlist_' + u.id, []) : []; },
  has(id) { return this.ids().includes(id); },
  toggle(id) {
    const u = Auth.user();
    if (!u) { toast('Inicia sesión como comprador para guardar favoritos'); setTimeout(() => navigate('login.html?role=buyer&next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)), 1000); return false; }
    if (u.role !== 'buyer') { toast('Los favoritos son para cuentas de comprador'); return false; }
    const ids = this.ids(); const i = ids.indexOf(id);
    if (i > -1) { ids.splice(i, 1); toast('Eliminado de tu lista de deseos'); } else { ids.push(id); toast('Guardado en tu lista de deseos ♡'); }
    Store.set('wishlist_' + u.id, ids); updateBadges(); return i === -1;
  },
};

/* La sesión (Auth) y todos los datos viven en api.js */

/* ---------- Toast ---------- */
function toast(msg) {
  let wrap = $('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  wrap.appendChild(t); setTimeout(() => t.remove(), 2600);
}

/* ---------- Tarjeta de producto ---------- */
function productCard(p) {
  const b = getBrand(p.brand) || { name: '' };
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  const stock = totalStock(p);
  const r = ratingOf(p);
  const name = escapeHtml(p.name);
  return `
  <article class="product-card" data-id="${p.id}">
    <div class="p-badges">
      ${off ? `<span class="tag tag-terra">-${off}%</span>` : ''}
      ${isNewProduct(p) ? '<span class="tag">Nuevo</span>' : ''}
      ${(p.features || []).includes('Edición limitada') ? '<span class="tag tag-forest">Limitado</span>' : ''}
    </div>
    <button class="icon-btn wish ${Wishlist.has(p.id) ? 'on' : ''}" data-wish="${p.id}" aria-label="Agregar ${name} a favoritos">${ICONS.heart}</button>
    <a href="product.html?id=${p.id}" class="p-img"><img src="${productImage(p)}" alt="${name}" loading="lazy"></a>
    <div class="p-body">
      <div class="p-brand">${escapeHtml(b.name)}</div>
      <h3 class="p-name"><a href="product.html?id=${p.id}">${name}</a></h3>
      <p class="p-desc">${escapeHtml(p.desc || '')}</p>
      <div class="p-meta">
        <span class="price">${moneyShort(p.price)}${p.compareAt ? `<s>${moneyShort(p.compareAt)}</s>` : ''}</span>
        ${r.count ? `<span class="stars"><i>★</i>${r.avg.toFixed(1)} (${r.count})</span>` : '<span class="stars muted">Sin reseñas</span>'}
      </div>
      <div class="swatches">${p.colors.map(c => `<span style="background:${(C[c] || {}).hex}" title="${(C[c] || {}).name || c}"></span>`).join('')}</div>
      <div class="p-actions">
        <button class="btn ${stock ? 'btn-primary' : 'btn-ghost'} btn-sm quick-add" data-add="${p.id}" ${stock ? '' : 'disabled'} aria-label="${stock ? 'Agregar ' + name + ' al carrito' : name + ' agotado'}">${stock ? ICONS.bag.replace('<svg', '<svg width="16" height="16" aria-hidden="true"') + ' Agregar al carrito' : 'Agotado'}</button>
      </div>
    </div>
  </article>`;
}

// Delegación global: wishlist + agregar rápido
document.addEventListener('click', e => {
  const w = e.target.closest('[data-wish]');
  if (w) { e.preventDefault(); const on = Wishlist.toggle(Number(w.dataset.wish)); w.classList.toggle('on', on); return; }
  const a = e.target.closest('[data-add]');
  if (a) {
    e.preventDefault(); const p = getProduct(a.dataset.add);
    const color = p.colors.find(c => p.sizes.some(s => p.stock[`${c}|${s}`] > 0));
    const size = p.sizes.find(s => p.stock[`${color}|${s}`] > 0);
    if (Cart.add(p.id, color, size, 1)) { toast(`${p.name} agregado al carrito`); openMiniCart(); }
  }
});

/* ---------- Header / Footer ---------- */
function renderHeader() {
  const page = document.body.dataset.page;
  if (page === 'checkout') { // Checkout sin distracciones
    document.body.insertAdjacentHTML('afterbegin', `
    <header class="checkout-header"><div class="container header-row">
      <a href="index.html" class="logo" style="color:var(--forest)">${LOGO_MARK}<span class="logo-word" style="color:var(--ink)">Vibe<span>Market</span></span></a>
      <div class="steps"><a href="cart.html">Carrito</a> › <span class="on">Datos y pago</span> › <span>Confirmación</span></div>
      <span class="secure">${ICONS.lock} Pago seguro</span>
    </div></header>
    <div class="drawer-backdrop" id="backdrop"></div>`);
    $('#backdrop').onclick = closeDrawers; updateBadges(); return;
  }
  const nav = [['index.html', 'Inicio', 'home'], ['catalog.html', 'Catálogo', 'catalog'], ['catalog.html?nuevo=1', 'Novedades', 'new'], ['catalog.html?ofertas=1', 'Ofertas', 'deals'], ['support.html', 'Ayuda', 'support']];
  const prm = new URLSearchParams(location.search);
  const active = page === 'catalog' ? (prm.get('nuevo') === '1' || prm.get('sort') === 'newest' ? 'new' : prm.get('ofertas') === '1' || prm.get('deals') === '1' ? 'deals' : 'catalog') : page;
  const u = Auth.user();
  const roleLinks = !u ? '' : u.role === 'buyer'
    ? `<a href="account.html#orders">Mis pedidos</a><a href="account.html#returns">Devoluciones</a><a href="account.html#wishlist">Favoritos</a><a href="account.html#profile">Mis datos</a>`
    : u.role === 'vendor' ? `<a href="vendor.html">Panel de mi marca</a><a href="vendor.html#new-product">Subir producto</a><a href="vendor.html#orders">Pedidos de mi marca</a>`
    : `<a href="admin.html">Panel de administración</a><a href="admin.html#vendors">Vendedores</a><a href="admin.html#products">Moderar productos</a>`;
  const userMenu = u
    ? `<div class="user-menu"><button class="user-pill" id="userPill" aria-haspopup="true"><span class="avatar sm">${escapeHtml(u.name[0].toUpperCase())}</span><span class="up-text"><strong>${escapeHtml(u.name.split(' ')[0])}</strong><small>${ROLE_LABEL[u.role]}</small></span></button>
        <div class="user-drop" id="userDrop"><div class="ud-head"><strong>${escapeHtml(u.name)}</strong><span class="small muted">${escapeHtml(u.email)}</span><span class="tag ${u.role === 'buyer' ? 'tag-forest' : u.role === 'vendor' ? 'tag-terra' : ''}" style="margin-top:6px;align-self:flex-start">${ROLE_LABEL[u.role]}</span></div>${roleLinks}<button id="logoutTop">Cerrar sesión</button></div></div>`
    : `<a href="login.html" class="btn btn-ghost btn-sm login-btn">${ICONS.user.replace('<svg', '<svg width="16" height="16"')} Iniciar sesión</a>`;
  const header = `
  <div class="announce">Envío gratis en compras desde <strong>${moneyShort(FREE_SHIPPING_MIN)}</strong> · Usa <strong>VIBE10</strong> y obtén 10% en tu pedido</div>
  <header class="site-header">
    <div class="container header-row">
      <button class="icon-btn menu-toggle" id="menuToggle" aria-label="Abrir menú">${ICONS.menu}</button>
      <a href="index.html" class="logo" aria-label="VibeMarket inicio" style="color:var(--forest)">${LOGO_MARK}<span class="logo-word" style="color:var(--ink)">Vibe<span>Market</span></span></a>
      <nav class="main-nav" aria-label="Principal">
        ${nav.map(([h, t, k]) => `<a href="${h}" class="${active === k ? 'active' : ''}">${t}</a>`).join('')}
      </nav>
      <div class="search" role="search">
        ${ICONS.search}
        <input type="search" id="globalSearch" placeholder="Busca productos, marcas…" autocomplete="off" aria-label="Buscar" aria-autocomplete="list" aria-controls="acList">
        <div class="autocomplete" id="acList" role="listbox"></div>
      </div>
      <div class="header-actions">
        ${!u || u.role === 'buyer' ? `<a href="${u ? 'account.html#wishlist' : 'login.html?role=buyer&next=account.html%23wishlist'}" class="icon-btn" aria-label="Favoritos">${ICONS.heart}<span class="badge-count" data-badge="wish" hidden></span></a>
        <button class="icon-btn" id="cartBtn" aria-label="Carrito">${ICONS.bag}<span class="badge-count" data-badge="cart" hidden></span></button>` : ''}
        ${userMenu}
      </div>
    </div>
  </header>
  <div class="drawer-backdrop" id="backdrop"></div>
  <aside class="drawer left" id="mobileNav" aria-label="Menú">
    <div class="drawer-head"><a href="index.html" class="logo" style="color:var(--forest)">${LOGO_MARK}<span class="logo-word" style="color:var(--ink)">Vibe<span>Market</span></span></a><button class="icon-btn" data-close>${ICONS.close}</button></div>
    <div class="drawer-body">
      <div class="search" style="max-width:none;margin-bottom:16px">${ICONS.search}<input type="search" id="mobileSearch" placeholder="Buscar…"></div>
      <div class="mobile-links">${nav.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}${u ? roleLinks + '<a href="#" id="logoutMobile">Cerrar sesión</a>' : '<a href="login.html">Iniciar sesión</a>'}${!u || u.role === 'buyer' ? '<a href="cart.html">Carrito</a>' : ''}</div>
    </div>
  </aside>
  <aside class="drawer right" id="miniCart" aria-label="Carrito">
    <div class="drawer-head"><h3>Tu carrito</h3><button class="icon-btn" data-close>${ICONS.close}</button></div>
    <div class="drawer-body" id="miniCartBody"></div>
    <div class="drawer-foot" id="miniCartFoot"></div>
  </aside>`;
  document.body.insertAdjacentHTML('afterbegin', header);

  $('#menuToggle').onclick = () => openDrawer('#mobileNav');
  if ($('#cartBtn')) $('#cartBtn').onclick = () => openMiniCart();
  const doLogout = e => { e && e.preventDefault(); Auth.logout(); toast('Sesión cerrada'); setTimeout(() => location.href = 'index.html', 500); };
  if ($('#userPill')) {
    $('#userPill').onclick = e => { e.stopPropagation(); $('#userDrop').classList.toggle('open'); };
    document.addEventListener('click', e => { if (!e.target.closest('.user-menu')) $('#userDrop').classList.remove('open'); });
    $('#logoutTop').onclick = doLogout;
  }
  if ($('#logoutMobile')) $('#logoutMobile').onclick = doLogout;
  $('#backdrop').onclick = closeDrawers;
  $$('[data-close]').forEach(b => b.onclick = closeDrawers);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawers(); });
  $('#mobileSearch').addEventListener('keydown', e => { if (e.key === 'Enter') navigate(`catalog.html?q=${encodeURIComponent(e.target.value)}`); });
  initAutocomplete($('#globalSearch'), $('#acList'));
  updateBadges();
}

function renderFooter() {
  const f = `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo" style="color:#A9C2B0">${LOGO_MARK}<span class="logo-word">Vibe<span>Market</span></span></a>
          <p style="margin-top:18px;max-width:300px;font-size:.92rem">El marketplace de marcas emergentes mexicanas. Diseño independiente, producción consciente.</p>
          <ul class="footer-contact" style="margin-top:16px">
            <li><a href="${CONTACT.whatsapp()}" target="_blank" rel="noopener">${ICONS.whatsapp} WhatsApp ${escapeHtml(COMPANY.phone)}</a></li>
            <li><a href="${CONTACT.gmail()}" target="_blank" rel="noopener">${ICONS.mail.replace('<svg', '<svg width="16" height="16"')} ${escapeHtml(COMPANY.email)}</a></li>
            <li><a href="${CONTACT.tel()}">${ICONS.phone.replace('<svg', '<svg width="16" height="16"')} Llamar</a></li>
          </ul>
        </div>
        <div><h4>Comprar</h4><ul>${CATEGORIES.map(c => `<li><a href="catalog.html?cat=${c.id}">${c.name}</a></li>`).join('')}</ul></div>
        <div><h4>Mi cuenta</h4><ul><li><a href="account.html">Mis pedidos</a></li><li><a href="account.html#tracking">Rastrear envío</a></li><li><a href="account.html#wishlist">Favoritos</a></li><li><a href="cart.html">Carrito</a></li></ul></div>
        <div><h4>Ayuda</h4><ul><li><a href="support.html#faq">Preguntas frecuentes</a></li><li><a href="support.html#contacto">Contacto</a></li><li><a href="support.html#empresa">Información de la empresa</a></li><li><a href="support.html#politicas">Devoluciones</a></li><li><a href="support.html#politicas">Privacidad</a></li><li><a href="support.html#politicas">Términos</a></li></ul></div>
        <div><h4>VibeMarket</h4><ul><li><a href="support.html#nosotros">Nosotros</a></li><li><a href="login.html?role=vendor">Vende con nosotros</a></li><li><a href="login.html?role=admin">Acceso administrativo</a></li></ul></div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 VibeMarket S.A. de C.V. · Hecho con cuidado en México</span>
        <div class="pay-icons"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span><span>PAYPAL</span><span>OXXO</span><span>MERCADO PAGO</span></div>
      </div>
    </div>
  </footer>`;
  document.body.insertAdjacentHTML('beforeend', f);
}

function openDrawer(sel) { $(sel).classList.add('open'); $('#backdrop').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeDrawers() { $$('.drawer.open, .filters.open').forEach(d => d.classList.remove('open')); $('#backdrop')?.classList.remove('open'); document.body.style.overflow = ''; }

function updateBadges() {
  const c = Cart.count(), w = Wishlist.ids().length;
  $$('[data-badge=cart]').forEach(b => { b.textContent = c; b.hidden = !c; });
  $$('[data-badge=wish]').forEach(b => { b.textContent = w; b.hidden = !w; });
}

/* ---------- Mini carrito ---------- */
function openMiniCart() { renderMiniCart(); openDrawer('#miniCart'); }
function renderMiniCart() {
  const items = Cart.items(), body = $('#miniCartBody'), foot = $('#miniCartFoot');
  if (!body) return;
  if (!items.length) {
    body.innerHTML = `<div class="empty-state" style="padding:40px 0"><p class="muted">Tu carrito está vacío.</p><a href="catalog.html" class="btn btn-primary">Explorar catálogo</a></div>`;
    foot.innerHTML = ''; return;
  }
  const sub = Cart.subtotal(), left = Math.max(0, FREE_SHIPPING_MIN - sub);
  body.innerHTML = `
    <div class="small">${left ? `Te faltan <strong>${moneyShort(left)}</strong> para envío gratis` : '¡Tienes <strong>envío gratis</strong>! 🌿'}</div>
    <div class="free-ship-bar"><span style="width:${Math.min(100, sub / FREE_SHIPPING_MIN * 100)}%"></span></div>
    ${items.map((it, i) => { const p = getProduct(it.id); return `
      <div class="mini-item">
        <img src="${productImage(p, it.color)}" alt="">
        <div><h5>${p.name}</h5><div class="small muted">${C[it.color].name} · ${it.size}</div>
          <div class="qty" style="margin-top:8px"><button data-mq="${i}" data-d="-1">−</button><input value="${it.qty}" readonly aria-label="Cantidad"><button data-mq="${i}" data-d="1">+</button></div></div>
        <div style="text-align:right"><div class="price">${moneyShort(p.price * it.qty)}</div><button class="link-btn" data-mr="${i}">Quitar</button></div>
      </div>`; }).join('')}`;
  foot.innerHTML = `<div class="sum-row" style="font-weight:600"><span>Subtotal</span><span>${money(sub)}</span></div>
    <p class="small muted">Envío y descuentos se calculan en el carrito.</p>
    <div style="display:grid;gap:8px"><a href="checkout.html" class="btn btn-primary btn-block">Finalizar compra</a><a href="cart.html" class="btn btn-ghost btn-block">Ver carrito</a></div>`;
  $$('[data-mq]', body).forEach(b => b.onclick = () => { const i = +b.dataset.mq; Cart.setQty(i, Cart.items()[i].qty + +b.dataset.d); renderMiniCart(); });
  $$('[data-mr]', body).forEach(b => b.onclick = () => { Cart.remove(+b.dataset.mr); renderMiniCart(); });
}

/* ---------- Búsqueda inteligente con autocompletado ---------- */
function searchAll(q) {
  const n = normalize(q.trim());
  if (n.length < 2) return null;
  const score = p => {
    const hay = normalize(`${p.name} ${(getBrand(p.brand) || {}).name} ${(getSub(p.sub) || {}).name} ${p.features.join(' ')} ${p.desc}`);
    if (normalize(p.name).startsWith(n)) return 3;
    if (normalize(p.name).includes(n)) return 2;
    return n.split(/\s+/).every(w => hay.includes(w)) ? 1 : 0;
  };
  return {
    products: activeProducts().map(p => [p, score(p)]).filter(x => x[1]).sort((a, b) => b[1] - a[1] || (b[0].sales || 0) - (a[0].sales || 0)).slice(0, 5).map(x => x[0]),
    brands: BRANDS.filter(b => b.status === 'approved' && normalize(b.name).includes(n)),
    cats: CATEGORIES.flatMap(c => [{ id: c.id, name: c.name, url: `catalog.html?cat=${c.id}` }, ...c.subs.map(s => ({ id: s.id, name: `${c.name} › ${s.name}`, url: `catalog.html?cat=${c.id}&sub=${s.id}` }))]).filter(c => normalize(c.name).includes(n)).slice(0, 4),
  };
}
function highlight(text, q) {
  const n = normalize(q.trim()); const i = normalize(text).indexOf(n);
  return i < 0 ? text : text.slice(0, i) + '<mark>' + text.slice(i, i + n.length) + '</mark>' + text.slice(i + n.length);
}
function initAutocomplete(input, list) {
  if (!input) return;
  let focusIdx = -1;
  const render = () => {
    const q = input.value; const r = searchAll(q); focusIdx = -1;
    if (!r) {
      list.innerHTML = `<div class="ac-group">Explora por categoría</div>${CATEGORIES.map(c => c.name).map(t => `<div class="ac-item" data-url="catalog.html?q=${t}">${ICONS.search.replace('<svg', '<svg width="16" height="16"')} ${t}</div>`).join('')}`;
      list.classList.add('open'); return;
    }
    let html = '';
    if (r.products.length) html += `<div class="ac-group">Productos</div>` + r.products.map(p => `<div class="ac-item" role="option" data-url="product.html?id=${p.id}"><img src="${productImage(p)}" alt=""><div>${highlight(escapeHtml(p.name), q)}<div class="small muted">${escapeHtml((getBrand(p.brand) || {}).name || '')}</div></div><span class="ac-price">${moneyShort(p.price)}</span></div>`).join('');
    if (r.brands.length) html += `<div class="ac-group">Marcas</div>` + r.brands.map(b => `<div class="ac-item" data-url="catalog.html?brand=${b.id}">${highlight(escapeHtml(b.name), q)} <span class="ac-price">${escapeHtml(b.city || '')}</span></div>`).join('');
    if (r.cats.length) html += `<div class="ac-group">Categorías</div>` + r.cats.map(c => `<div class="ac-item" data-url="${c.url}">${highlight(c.name, q)}</div>`).join('');
    html += `<div class="ac-item" data-url="catalog.html?q=${encodeURIComponent(q)}" style="color:var(--forest);font-weight:500">Ver todos los resultados para “${escapeHtml(q)}” →</div>`;
    if (!r.products.length && !r.brands.length && !r.cats.length) html = `<div class="ac-empty">Sin coincidencias para “${escapeHtml(q)}”.</div>`;
    list.innerHTML = html; list.classList.add('open');
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('keydown', e => {
    const items = $$('.ac-item', list);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); focusIdx = (focusIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle('focused', i === focusIdx));
    } else if (e.key === 'Enter') {
      if (focusIdx > -1 && items[focusIdx]) navigate(items[focusIdx].dataset.url);
      else if (input.value.trim()) navigate(`catalog.html?q=${encodeURIComponent(input.value.trim())}`);
    } else if (e.key === 'Escape') list.classList.remove('open');
  });
  list.addEventListener('mousedown', e => { const it = e.target.closest('.ac-item'); if (it) navigate(it.dataset.url); });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) list.classList.remove('open'); });
}

/* ---------- Chatbot flotante (rule-based; luego: API de IA / WhatsApp Business) ---------- */
const BOT_RULES = [
  [/envi|entreg|llega|tard/, 'Enviamos a todo México. Estándar: 3–5 días hábiles ($99). Express: 1–2 días ($189). Gratis desde $999. 🚚'],
  [/devol|cambio|reembols/, 'Tienes 30 días para devoluciones gratuitas. Inicia el proceso desde Mi cuenta › Pedidos o en Ayuda › Devoluciones.'],
  [/vm-\d+/, text => {
    const id = text.toUpperCase().match(/VM-\d+/)[0]; const o = Orders.get(id);
    if (!o) return `No encontré el pedido ${id}. Revisa el número en tu correo de confirmación.`;
    const u = Auth.user();
    if (!u || (u.role === 'buyer' && u.email.toLowerCase() !== o.email.toLowerCase())) return `Para proteger tus datos, inicia sesión con la cuenta que hizo el pedido ${id} y revisa Mi cuenta › Seguimiento.`;
    return `Tu pedido ${id} está: ${STATUS_LABEL[o.status]}.${o.shipping?.tracking ? ` Guía ${o.shipping.carrier} ${o.shipping.tracking}.` : ''}`;
  }],
  [/rastre|seguim|pedido|orden/, 'Puedes rastrear tu pedido en Mi cuenta › Seguimiento. Si me compartes tu número (ej. VM-10001) lo reviso.'],
  [/pago|tarjeta|paypal|oxxo|meses/, 'Aceptamos tarjetas (Visa, MC, Amex) vía Stripe, PayPal, Mercado Pago y pago en efectivo en OXXO. Hasta 6 MSI con tarjetas participantes.'],
  [/cupon|descuento|codigo|promo/, 'Usa VIBE10 para 10% de descuento, o BIENVENIDA15 si es tu primera compra (mínimo $800).'],
  [/vend|marca|emprend|comision/, '¡Nos encanta! Las marcas emergentes pagan una comisión del 12% por venta, sin mensualidad. Regístrate en Iniciar sesión › Vendedor.'],
  [/humano|asesor|persona|agente/, 'Te conecto con una persona del equipo. También puedes escribirnos por WhatsApp (botón abajo). Horario: L–S 9:00–20:00.'],
  [/hola|buen|hey/, '¡Hola! 🌿 Soy Vibe, tu asistente. ¿En qué te ayudo hoy?'],
  [/gracias/, '¡Con gusto! Si necesitas algo más, aquí estoy. ✨'],
];
function initChatbot() {
  document.body.insertAdjacentHTML('beforeend', `
    <button class="chat-fab" id="chatFab" aria-label="Abrir chat de ayuda">${ICONS.chat}<span class="dot"></span></button>
    <section class="chat-panel" id="chatPanel" aria-label="Chat de soporte">
      <div class="chat-head"><div class="av">${LOGO_MARK.replace('viewBox', 'width="22" height="22" viewBox').replace('currentColor', '#fff').replace('currentColor', '#fff')}</div><div><strong>Vibe · Asistente</strong><small>En línea · responde al instante</small></div><button class="icon-btn" id="chatClose" aria-label="Cerrar">${ICONS.close}</button></div>
      <div class="chat-body" id="chatBody"></div>
      <div class="chat-quick" id="chatQuick">${['¿Cuánto tarda el envío?', 'Rastrear pedido', 'Devoluciones', 'Métodos de pago', 'Hablar con un asesor'].map(q => `<button>${q}</button>`).join('')}</div>
      <form class="chat-form" id="chatForm"><input id="chatInput" placeholder="Escribe tu mensaje…" autocomplete="off" aria-label="Mensaje"><button aria-label="Enviar">${ICONS.send}</button></form>
      <a class="wa-link" href="${CONTACT.whatsapp()}" target="_blank" rel="noopener">${ICONS.whatsapp} Continuar en WhatsApp</a>
    </section>`);
  const panel = $('#chatPanel'), body = $('#chatBody');
  const add = (t, who) => { const m = document.createElement('div'); m.className = 'msg ' + who; m.textContent = t; body.appendChild(m); body.scrollTop = body.scrollHeight; return m; };
  const reply = text => {
    const n = normalize(text);
    const r = BOT_RULES.find(([re]) => re.test(n));
    const typing = add('Escribiendo…', 'bot typing');
    setTimeout(() => { typing.remove(); add(r ? (typeof r[1] === 'function' ? r[1](text) : r[1]) : 'Mmm, no estoy seguro. Puedo ayudarte con envíos, devoluciones, pagos o rastreo. ¿O prefieres hablar con un asesor?', 'bot'); }, 700);
  };
  let started = false;
  $('#chatFab').onclick = () => {
    panel.classList.toggle('open'); $('#chatFab .dot')?.remove();
    if (!started) { started = true; add('¡Hola! 🌿 Soy Vibe. Puedo ayudarte con tu pedido, envíos, devoluciones o a encontrar el regalo perfecto.', 'bot'); }
    if (panel.classList.contains('open')) $('#chatInput').focus();
  };
  $('#chatClose').onclick = () => panel.classList.remove('open');
  $('#chatForm').onsubmit = e => { e.preventDefault(); const v = $('#chatInput').value.trim(); if (!v) return; add(v, 'me'); $('#chatInput').value = ''; reply(v); };
  $$('#chatQuick button').forEach(b => b.onclick = () => { add(b.textContent, 'me'); reply(b.textContent); });
  window.openChat = () => { if (!panel.classList.contains('open')) $('#chatFab').click(); };
}

/* ---------- Init ---------- */
/* ---------- Bienvenida: ¿cómo quieres entrar? (primera visita, sin sesión) ---------- */
function roleCards(compact) {
  return [
    ['buyer', ICONS.bag, 'Comprador', 'Explora, compra, guarda favoritos, haz devoluciones y lee reseñas de otros compradores.'],
    ['vendor', ICONS.box, 'Vendedor', 'Sube los productos de tu marca, controla tu stock, pedidos y ganancias.'],
    ['admin', ICONS.shield, 'Administrador', 'Supervisa vendedores, compradores, productos, pedidos y comisiones.'],
  ].map(([r, i, t, d]) => `<a href="login.html?role=${r}" class="role-card" data-role="${r}"><span class="ico">${i}</span><strong>${t}</strong>${compact ? '' : `<span class="small muted">${d}</span>`}<span class="role-go">Entrar como ${t.toLowerCase()} →</span></a>`).join('');
}
function maybeWelcome() {
  if (Auth.user() || Store.get('welcome_seen', false) || !['home', 'catalog', 'product'].includes(document.body.dataset.page)) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop open" id="welcome" role="dialog" aria-modal="true" aria-labelledby="wTitle">
    <div class="modal welcome">
      <button class="icon-btn" id="wClose" aria-label="Cerrar" style="position:absolute;top:14px;right:14px">${ICONS.close}</button>
      <div style="color:var(--forest);width:48px;margin:0 auto 10px">${LOGO_MARK}</div>
      <h2 id="wTitle">Bienvenido a VibeMarket</h2><p class="muted">¿Cómo quieres iniciar sesión?</p>
      <div class="role-grid">${roleCards()}</div>
      <button class="link-btn" id="wSkip" style="margin-top:18px">Solo quiero explorar la tienda</button>
    </div></div>`);
  const close = () => { Store.set('welcome_seen', true); $('#welcome').remove(); };
  $('#wClose').onclick = close; $('#wSkip').onclick = close;
  $$('#welcome .role-card').forEach(a => a.addEventListener('click', () => Store.set('welcome_seen', true)));
}

onReady(() => {
  if (document.body.dataset.shell === 'panel') return; // login, vendedor y admin usan su propio layout
  renderHeader();
  renderFooter();
  initChatbot();
  maybeWelcome();
  document.addEventListener('store:cart', () => { if ($('#miniCart.open')) renderMiniCart(); });
});
