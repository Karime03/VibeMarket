/* VibeMarket — Estructura compartida de los paneles (vendedor y administrador) */
const Panel = {
  views: {}, current: null,
  /**
   * @param {object} cfg { role, title, sections:[[label,[[id,text,icon,badgeFn]]]], views:{id:renderFn} }
   */
  init(cfg) {
    const u = Auth.require(cfg.role); if (!u) return null;
    this.views = cfg.views; this.cfg = cfg;
    document.body.innerHTML = `
      <div class="app-shell">
        <aside class="side" id="side">
          <a href="index.html" class="logo">${LOGO_MARK}<span class="logo-word">Vibe<span>Market</span></span></a>
          <div class="tag" style="margin:0 10px 8px;background:rgba(255,255,255,.08);color:#E8B79E;align-self:flex-start">${cfg.badge}</div>
          ${cfg.sections.map(([label, items]) => `<div class="side-label">${label}</div><nav>${items.map(([id, t, i]) => `<button data-view="${id}">${i}<span>${t}</span><span class="nbadge" data-nb="${id}" hidden></span></button>`).join('')}</nav>`).join('')}
          <div class="side-label">Tienda</div><nav><a href="index.html" target="_blank">${ICONS.home}<span>Ver la tienda</span></a></nav>
          <div class="side-foot"><span class="avatar sm">${escapeHtml(u.name[0])}</span><div style="flex:1;min-width:0"><strong style="color:#fff;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(u.name)}</strong><span class="small">${ROLE_LABEL[u.role]}</span></div><button class="icon-btn" id="pLogout" title="Cerrar sesión" style="color:#C9CFC7">${ICONS.logout}</button></div>
        </aside>
        <div class="drawer-backdrop" id="backdrop"></div>
        <div class="main">
          <div class="topbar"><button class="icon-btn side-toggle" id="sideToggle" aria-label="Menú">${ICONS.menu}</button><div><div class="small muted" id="tbCrumb">${cfg.title}</div><h1 id="tbTitle"></h1></div><div class="tb-actions" id="tbActions"></div></div>
          <div id="viewRoot"></div>
        </div>
      </div>
      <div class="modal-backdrop" id="pModal" role="dialog" aria-modal="true"><div class="modal mini-modal" id="pModalBody"></div></div>`;
    $$('[data-view]').forEach(b => b.onclick = () => this.go(b.dataset.view));
    $('#pLogout').onclick = () => { Auth.logout(); location.href = 'login.html'; };
    $('#sideToggle').onclick = () => { $('#side').classList.add('open'); $('#backdrop').classList.add('open'); };
    $('#backdrop').onclick = () => { $('#side').classList.remove('open'); $('#backdrop').classList.remove('open'); };
    $('#pModal').addEventListener('click', e => { if (e.target.id === 'pModal' || e.target.closest('[data-close-modal]')) this.closeModal(); });
    window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v && v !== this.current) this.go(v); });
    this.go(location.hash.slice(1) || Object.keys(cfg.views)[0]);
    return u;
  },
  go(id, arg) {
    const key = this.views[id] ? id : Object.keys(this.views)[0];
    this.current = key;
    $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === key));
    history.replaceState(null, '', '#' + key);
    $('#tbActions').innerHTML = '';
    $('#side').classList.remove('open'); $('#backdrop').classList.remove('open');
    const old = $('#viewRoot'); const root = old.cloneNode(false); old.replaceWith(root); // contenedor limpio: sin listeners de la vista anterior
    this.views[key](root, arg);
    this.refreshBadges();
    window.scrollTo(0, 0);
  },
  refresh() { this.go(this.current); },
  setTitle(t, actionsHtml = '') {
    $('#tbTitle').textContent = t; document.title = `${t} — VibeMarket`;
    // "Actualizar" vuelve a leer la base de datos (p. ej. si llegó un pedido o una marca nueva)
    $('#tbActions').innerHTML = actionsHtml + `<button class="btn btn-ghost btn-sm" id="tbRefresh" title="Volver a cargar los datos">↻ Actualizar</button>`;
    $('#tbRefresh').onclick = async () => { await DB.flush(); location.reload(); };
  },
  refreshBadges() { (this.cfg.badges ? Object.entries(this.cfg.badges()) : []).forEach(([id, n]) => { const el = $(`[data-nb="${id}"]`); if (el) { el.textContent = n; el.hidden = !n; } }); },
  modal(html) { $('#pModalBody').innerHTML = html; $('#pModal').classList.add('open'); },
  closeModal() { $('#pModal').classList.remove('open'); },
  confirm(msg, okText, onOk, withNote) {
    this.modal(`<h3>${msg}</h3>${withNote ? `<div class="field"><label>${withNote}</label><textarea class="input" id="cNote" style="min-height:80px"></textarea></div>` : ''}<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px"><button class="btn btn-ghost" data-close-modal>Cancelar</button><button class="btn btn-primary" id="cOk">${okText}</button></div>`);
    $('#cOk').onclick = () => { const note = withNote ? $('#cNote').value.trim() : ''; this.closeModal(); onOk(note); };
  },
};

/* ---------- Componentes ---------- */
const kpi = (label, value, sub, cls = '') => `<div class="kpi ${cls}"><span>${label}</span><strong>${value}</strong>${sub ? `<small class="${String(sub).startsWith('−') || String(sub).startsWith('-') ? 'down' : ''}">${sub}</small>` : ''}</div>`;
const pill = (text, kind) => `<span class="st st-${kind}">${text}</span>`;
const PRODUCT_STATUS = { active: ['Publicado', 'ok'], pending_review: ['En revisión', 'warn'], rejected: ['Rechazado', 'bad'], paused: ['Pausado', 'mute'] };
const ORDER_KIND = { pending_payment: 'warn', paid: 'info', preparing: 'info', shipped: 'warn', delivered: 'ok', cancelled: 'bad', refunded: 'mute' };
const RETURN_KIND = { requested: 'warn', approved: 'info', received: 'info', refunded: 'ok', rejected: 'bad' };
const fmtD = d => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
const shortMoney = n => n >= 1e6 ? '$' + (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? '$' + (n / 1e3).toFixed(1) + 'k' : moneyShort(Math.round(n));

/** Ventas por mes (últimos n meses) a partir de una función que devuelve monto por pedido */
function monthlySeries(orders, amountFn, n = 6) {
  const now = new Date(); const months = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ y: d.getFullYear(), m: d.getMonth(), label: d.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''), v: 0 }); }
  orders.forEach(o => { if (o.status === 'cancelled') return; const d = new Date(o.date); const mm = months.find(x => x.y === d.getFullYear() && x.m === d.getMonth()); if (mm) mm.v += amountFn(o); });
  return months;
}
function barChart(series) {
  const max = Math.max(1, ...series.map(s => s.v));
  return `<div class="bars-chart">${series.map(s => `<div class="col" title="${s.label}: ${money(s.v)}"><span class="val">${shortMoney(s.v)}</span><div class="bar" style="height:${Math.max(2, s.v / max * 150)}px"></div><span class="lbl">${s.label}</span></div>`).join('')}</div>`;
}
function hBars(rows, fmt = shortMoney) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return `<div class="hbars">${rows.map(([l, v, color]) => `<div class="hbar"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l}</span><span class="track"><span style="width:${v / max * 100}%;${color ? 'background:' + color : ''}"></span></span><b>${fmt(v)}</b></div>`).join('')}</div>`;
}
