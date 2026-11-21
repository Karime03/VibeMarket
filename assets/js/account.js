/* VibeMarket — Pantalla del COMPRADOR: pedidos, rastreo, devoluciones, reseñas, favoritos, datos, direcciones, preferencias */
onReady(() => {
  const session = Auth.user();
  if (session && session.role !== 'buyer') { location.replace(ROLE_HOME[session.role]); return; }
  if (!Auth.require('buyer')) return;
  const me = () => Auth.profile();

  const STATUS = {
    pending_payment: ['Pago pendiente', 'tag'], paid: ['Pagado', 'tag tag-forest'], preparing: ['Preparando', 'tag tag-forest'],
    shipped: ['En camino', 'tag tag-terra'], delivered: ['Entregado', 'tag'], cancelled: ['Cancelado', 'tag'], refunded: ['Reembolsado', 'tag'],
  };
  const myOrders = () => Orders.all().filter(o => o.email.toLowerCase() === session.email.toLowerCase());
  const myReturns = () => Returns.all().filter(r => r.email.toLowerCase() === session.email.toLowerCase());
  const fmtDate = d => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  const NAV = [['overview', 'Resumen', ICONS.home], ['orders', 'Mis pedidos', ICONS.box], ['tracking', 'Seguimiento', ICONS.truck], ['returns', 'Devoluciones', ICONS.return], ['reviews', 'Mis reseñas', ICONS.chat], ['wishlist', 'Favoritos', ICONS.heart], ['profile', 'Datos personales', ICONS.user], ['addresses', 'Direcciones', ICONS.pin], ['prefs', 'Comunicación', ICONS.bell]];
  const u = me();
  $('#accAvatar').textContent = u.name[0].toUpperCase(); $('#accName').textContent = u.name; $('#accSince').textContent = 'Comprador desde ' + new Date(u.since).getFullYear();
  $('#accNav').insertAdjacentHTML('beforeend', NAV.map(([k, l, i]) => `<button data-p="${k}">${i}${l}</button>`).join('') + `<button id="logoutBtn">${ICONS.logout}Cerrar sesión</button>`);
  $$('#accNav [data-p]').forEach(b => b.onclick = () => show(b.dataset.p));
  $('#logoutBtn').onclick = () => { Auth.logout(); toast('Sesión cerrada'); setTimeout(() => location.href = 'index.html', 400); };

  const modal = html => { $('#accModalBody').innerHTML = html; $('#accModal').classList.add('open'); };
  const closeModal = () => $('#accModal').classList.remove('open');
  $('#accModal').addEventListener('click', e => { if (e.target.id === 'accModal' || e.target.closest('[data-close-modal]')) closeModal(); });

  function show(panel, arg) {
    if (!NAV.some(n => n[0] === panel)) panel = 'overview';
    $$('#accNav [data-p]').forEach(b => b.classList.toggle('active', b.dataset.p === panel));
    $$('.acc-panel').forEach(p => p.classList.toggle('active', p.id === 'p-' + panel));
    history.replaceState(null, '', '#' + panel);
    ({ overview, orders, tracking, returns, reviews, wishlist, profile, addresses, prefs })[panel](arg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));

  const orderCard = o => {
    const daysSince = (Date.now() - new Date(o.date)) / 864e5;
    const canReturn = o.status === 'delivered' && daysSince <= 40;
    return `
    <article class="order">
      <div class="order-head">
        <div><span>Pedido</span><strong>${o.id}</strong></div>
        <div><span>Fecha</span>${fmtDate(o.date)}</div>
        <div><span>Total</span>${money(o.totals.total)}</div>
        <div><span>Envío a</span>${escapeHtml(o.address.city || '')}</div>
        <span class="${STATUS[o.status][1]}">${STATUS[o.status][0]}</span>
      </div>
      <div class="order-body">
        ${o.items.map(it => { const p = getProduct(it.id); return p ? `<a href="product.html?id=${p.id}" title="${escapeHtml(p.name)}"><img src="${productImage(p, it.color)}" alt="${escapeHtml(p.name)}"></a>` : ''; }).join('')}
        <div class="small muted">${o.items.map(it => `${(getProduct(it.id) || { name: 'Producto' }).name} ×${it.qty}`).join(', ')}</div>
        <div class="actions">
          ${o.status !== 'cancelled' ? `<button class="btn btn-outline btn-sm" data-track="${o.id}">Rastrear</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-reorder="${o.id}">Volver a comprar</button>
          ${canReturn ? `<button class="btn btn-ghost btn-sm" data-return="${o.id}">Devolver</button>` : ''}
        </div>
      </div>
    </article>`;
  };
  const bindOrderActions = root => {
    $$('[data-track]', root).forEach(b => b.onclick = () => show('tracking', b.dataset.track));
    $$('[data-reorder]', root).forEach(b => b.onclick = () => { const o = myOrders().find(x => x.id === b.dataset.reorder); let n = 0; o.items.forEach(i => { if (Cart.add(i.id, i.color, i.size, i.qty)) n++; }); if (n) { toast('Productos agregados al carrito'); openMiniCart(); } });
    $$('[data-return]', root).forEach(b => b.onclick = () => returnModal(b.dataset.return));
  };

  // ---------- Resumen ----------
  function overview() {
    const os = myOrders(), spent = os.filter(o => o.status !== 'cancelled').reduce((a, o) => a + o.totals.total, 0);
    const pendingRev = toReview().length;
    $('#p-overview').innerHTML = `
      <h2>Hola, ${escapeHtml(me().name.split(' ')[0])} 🌿</h2><p class="muted">Desde aquí gestionas tus pedidos, devoluciones, favoritos y preferencias.</p>
      <div class="stat-cards">
        <div class="card"><span class="muted small">Pedidos</span><strong>${os.length}</strong></div>
        <div class="card"><span class="muted small">Favoritos</span><strong>${Wishlist.ids().length}</strong></div>
        <div class="card"><span class="muted small">Has apoyado a</span><strong>${new Set(os.flatMap(o => o.items.map(i => (getProduct(i.id) || {}).brand))).size} marcas</strong></div>
      </div>
      ${pendingRev ? `<div class="banner ok">${ICONS.chat.replace('<svg', '<svg width="20" height="20"')} Tienes <strong>${pendingRev}</strong> ${pendingRev === 1 ? 'producto' : 'productos'} por reseñar. Tu opinión ayuda a otros compradores. <button class="btn btn-primary btn-sm" style="margin-left:auto" data-goto="reviews">Escribir reseñas</button></div>` : ''}
      <div class="card" style="margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;background:var(--forest-soft);border-color:transparent">
        <div><strong style="font-family:var(--font-serif);font-size:1.2rem;font-weight:450">Vibe Club · Nivel ${spent >= 5000 ? 'Raíz' : 'Brote'}</strong><div class="small muted">Llevas ${money(spent)} en compras. ${spent >= 5000 ? 'Tienes envíos express gratis.' : `A ${money(5000 - spent)} del nivel Raíz (envíos express gratis).`}</div></div>
        <div class="free-ship-bar" style="width:220px;background:#fff"><span style="width:${Math.min(100, spent / 50)}%"></span></div>
      </div>
      <div class="section-head" style="margin-bottom:16px"><h3 style="margin:0">Pedido más reciente</h3><button class="link-btn" data-goto="orders">Ver todos →</button></div>
      ${os[0] ? orderCard(os[0]) : '<div class="card"><p class="muted">Aún no tienes pedidos.</p><a class="btn btn-primary btn-sm" href="catalog.html">Explorar catálogo</a></div>'}`;
    bindOrderActions($('#p-overview'));
    $$('[data-goto]', $('#p-overview')).forEach(b => b.onclick = () => show(b.dataset.goto));
  }

  // ---------- Pedidos ----------
  function orders() {
    const os = myOrders();
    $('#p-orders').innerHTML = `<h2>Mis pedidos</h2>
      <div class="cat-pills" id="oFilter" style="margin-bottom:20px"><button class="pill active" data-f="all">Todos (${os.length})</button><button class="pill" data-f="active">En curso</button><button class="pill" data-f="delivered">Entregados</button></div>
      <div id="oList"></div>`;
    const draw = f => {
      const list = os.filter(o => f === 'all' || (f === 'delivered' ? o.status === 'delivered' : !['delivered', 'cancelled'].includes(o.status)));
      $('#oList').innerHTML = list.length ? list.map(orderCard).join('') : '<p class="muted">Sin pedidos en esta vista.</p>'; bindOrderActions($('#oList'));
    };
    $$('#oFilter .pill').forEach(b => b.onclick = () => { $$('#oFilter .pill').forEach(x => x.classList.toggle('active', x === b)); draw(b.dataset.f); });
    draw('all');
  }

  // ---------- Seguimiento ----------
  function tracking(orderId) {
    const os = myOrders().filter(o => o.status !== 'cancelled');
    const o = os.find(x => x.id === orderId) || os.find(x => x.status !== 'delivered') || os[0];
    if (!o) { $('#p-tracking').innerHTML = '<h2>Seguimiento</h2><p class="muted">No hay envíos para rastrear.</p>'; return; }
    const fmt = d => new Date(d).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const pending = o.status === 'pending_payment', delivered = o.status === 'delivered', refunded = o.status === 'refunded';
    // Pasos: el primero cambia de nombre mientras no se paga
    const steps = [pending ? 'Esperando pago' : 'Pago confirmado', 'Preparando', 'Enviado', 'En camino', 'Entregado'];
    const reached = { pending_payment: -1, paid: 0, preparing: 1, shipped: 2, delivered: 4, refunded: 4 }[o.status] ?? 0;
    const cls = i => i <= reached ? 'done' : i === reached + 1 ? 'current' : '';
    // Historial real del pedido (más reciente primero). Pedidos antiguos sin historial: solo el registro del pedido.
    const history = (o.history && o.history.length ? o.history : [{ title: 'Pedido recibido', detail: '', date: o.date }]).slice().reverse();
    const trackingByBrand = Object.entries(o.vendorTracking || {});
    const eta = pending ? 'Se calcula al confirmar tu pago' : delivered ? 'Entregado' : refunded ? 'Pedido reembolsado' : (o.shipping.eta || 'Por confirmar');
    $('#p-tracking').innerHTML = `
      <h2>Seguimiento de envío</h2>
      <select class="input" id="trkSel" style="max-width:280px;margin-bottom:12px">${os.map(x => `<option value="${x.id}" ${x.id === o.id ? 'selected' : ''}>${x.id} · ${STATUS[x.status][0]}</option>`).join('')}</select>
      ${pending ? `<div class="banner warn">${ICONS.bell.replace('<svg', '<svg width="20" height="20"')}<div><strong>Tu pago está pendiente.</strong> ${o.payRef ? `Paga en cualquier OXXO con la referencia <strong>${o.payRef}</strong>${o.payExpires ? ` (vence el ${fmt(o.payExpires)})` : ''}. ` : ''}Prepararemos tu pedido en cuanto se confirme el pago.</div></div>` : ''}
      <div class="card">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div><span class="muted small">Envío</span><div><strong>${escapeHtml(o.shipping.method || 'Estándar')}</strong> · ${escapeHtml(o.shipping.carrier || '')}</div>
            <div class="small" style="margin-top:4px">${trackingByBrand.length ? trackingByBrand.map(([b, t]) => `Guía ${escapeHtml(t)}${trackingByBrand.length > 1 ? ` <span class="muted">(${escapeHtml((getBrand(b) || {}).name || '')})</span>` : ''}`).join('<br>') : '<span class="muted">La guía se asignará cuando la marca envíe tu paquete</span>'}</div></div>
          <div><span class="muted small">Entrega estimada</span><div><strong>${eta}</strong></div></div>
        </div>
        <div class="track"><div class="fill" style="width:${Math.max(0, reached) * 20}%"></div>${steps.map((st, i) => `<div class="track-step ${cls(i)}"><div class="dot">${i <= reached ? '✓' : ''}</div>${st}</div>`).join('')}</div>
        <ul class="timeline">${history.map(h => `<li class="${h.status === 'pending_payment' ? 'pending' : ''}"><strong>${escapeHtml(h.title)}</strong><div class="small muted">${fmt(h.date)}${h.detail ? ' · ' + escapeHtml(h.detail) : ''}</div></li>`).join('')}</ul>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><a class="btn btn-outline btn-sm" href="${CONTACT.whatsapp(`Hola VibeMarket, tengo una duda sobre mi pedido ${o.id}`)}" target="_blank" rel="noopener">${ICONS.whatsapp} Avisos por WhatsApp</a><button class="btn btn-ghost btn-sm" onclick="openChat()">¿Problemas con tu pedido?</button></div>
      </div>`;
    $('#trkSel').onchange = e => tracking(e.target.value);
  }

  // ---------- Devoluciones ----------
  function returnModal(orderId) {
    const o = myOrders().find(x => x.id === orderId);
    const already = myReturns().filter(r => r.orderId === orderId).map(r => r.productId);
    const items = o.items.filter(i => !already.includes(i.id));
    if (!items.length) return toast('Ya solicitaste la devolución de todos los productos de este pedido');
    modal(`<h3>Solicitar devolución · ${o.id}</h3><p class="small muted">Tienes 30 días desde la entrega. Te enviaremos una guía prepagada.</p>
      <form id="retForm">
        <div class="field"><label>Producto</label><select class="input" name="item">${items.map((i, k) => `<option value="${k}">${getProduct(i.id).name} · ${C[i.color]?.name || i.color} · ${i.size} (×${i.qty})</option>`).join('')}</select></div>
        <div class="field"><label>Motivo</label><select class="input" name="reason"><option>Llegó dañado</option><option>No es la talla correcta</option><option>No es como en la descripción</option><option>Recibí un producto equivocado</option><option>Ya no lo quiero</option></select></div>
        <div class="field"><label>Comentarios (opcional)</label><textarea class="input" name="comment" style="min-height:80px" placeholder="Cuéntanos qué pasó"></textarea></div>
        <div class="field"><label>Foto (opcional)</label><input class="input" type="file" accept="image/*"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn btn-ghost" data-close-modal>Cancelar</button><button class="btn btn-primary">Enviar solicitud</button></div>
      </form>`);
    $('#retForm').onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target); const it = items[+f.get('item')];
      const list = Returns.all();
      const id = Returns.newId();
      list.unshift({ id, orderId, email: session.email, userId: session.id, productId: it.id, color: it.color, size: it.size, qty: 1, amount: (it.price ?? getProduct(it.id).price), reason: f.get('reason'), comment: f.get('comment'), status: 'requested', date: new Date().toISOString() });
      Returns.saveAll(list); closeModal(); toast(`Solicitud ${id} enviada. Te avisaremos por correo.`); show('returns');
    };
  }
  function returns() {
    const list = myReturns();
    const cls = { requested: 'tag', approved: 'tag tag-forest', received: 'tag tag-forest', refunded: 'tag tag-forest', rejected: 'tag tag-terra' };
    const eligible = myOrders().filter(o => o.status === 'delivered' && (Date.now() - new Date(o.date)) / 864e5 <= 40);
    $('#p-returns').innerHTML = `<h2>Devoluciones</h2><p class="muted">Devoluciones gratuitas durante 30 días después de la entrega.</p>
      ${eligible.length ? `<div class="card" style="margin-bottom:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span>Iniciar una devolución del pedido</span><select class="input" id="retOrder" style="max-width:240px">${eligible.map(o => `<option>${o.id}</option>`).join('')}</select><button class="btn btn-primary btn-sm" id="retStart">Continuar</button></div>` : ''}
      ${list.length ? list.map(r => { const p = getProduct(r.productId); return `<article class="order"><div class="order-head"><div><span>Folio</span><strong>${r.id}</strong></div><div><span>Pedido</span>${r.orderId}</div><div><span>Fecha</span>${fmtDate(r.date)}</div><div><span>Reembolso</span>${money(r.amount)}</div><span class="${cls[r.status]}">${RETURN_LABEL[r.status]}</span></div>
        <div class="order-body"><img src="${productImage(p, r.color)}" alt=""><div><strong>${p.name}</strong><div class="small muted">Motivo: ${escapeHtml(r.reason)}${r.comment ? ' · “' + escapeHtml(r.comment) + '”' : ''}</div>${r.adminNote ? `<div class="small" style="margin-top:4px">Nota de VibeMarket: ${escapeHtml(r.adminNote)}</div>` : ''}</div>
        <div class="actions">${['approved'].includes(r.status) ? '<button class="btn btn-outline btn-sm" onclick="toast(\'Guía de retorno descargada (demo)\')">Descargar guía</button>' : ''}${r.status === 'requested' ? `<button class="btn btn-ghost btn-sm" data-cancel="${r.id}">Cancelar solicitud</button>` : ''}</div></div></article>`; }).join('') : '<div class="card"><p class="muted" style="margin:0">No tienes devoluciones registradas.</p></div>'}`;
    $('#retStart')?.addEventListener('click', () => returnModal($('#retOrder').value));
    $$('[data-cancel]').forEach(b => b.onclick = () => { Returns.saveAll(Returns.all().filter(r => r.id !== b.dataset.cancel)); toast('Solicitud cancelada'); returns(); });
  }

  // ---------- Mis reseñas ----------
  function toReview() {
    const mine = new Set(Reviews.all().filter(r => r.userId === session.id).map(r => r.productId));
    const ids = [...new Set(myOrders().filter(o => o.status === 'delivered').flatMap(o => o.items.map(i => i.id)))];
    return ids.filter(id => !mine.has(id) && getProduct(id));
  }
  function reviews() {
    const mine = Reviews.all().filter(r => r.userId === session.id);
    const pend = toReview();
    $('#p-reviews').innerHTML = `<h2>Mis reseñas</h2><p class="muted">Tus opiniones ayudan a otros compradores y a las marcas a mejorar.</p>
      ${pend.length ? `<h3 style="margin-top:20px">Por reseñar</h3><div class="addr-grid" style="margin-bottom:28px">${pend.map(id => { const p = getProduct(id); return `<div class="card" style="display:flex;gap:14px;align-items:center"><img src="${productImage(p)}" style="width:56px;height:70px;object-fit:cover;border-radius:6px" alt=""><div style="flex:1"><strong>${p.name}</strong><div class="small muted">${getBrand(p.brand).name}</div></div><a class="btn btn-primary btn-sm" href="product.html?id=${p.id}">Calificar</a></div>`; }).join('')}</div>` : ''}
      <h3>Publicadas (${mine.length})</h3>
      ${mine.length ? mine.map(r => { const p = getProduct(r.productId); return `<div class="review"><div class="review-head"><div><a href="product.html?id=${p.id}"><strong>${p.name}</strong></a> · <span class="stars"><i>${starStr(r.rating)}</i></span></div><span class="small muted">${fmtDate(r.date)} · 👍 ${r.helpful}</span></div><strong>${escapeHtml(r.title)}</strong><p style="margin:4px 0 0">${escapeHtml(r.text)}</p>${r.reply ? `<div class="review-reply"><strong>Respuesta de ${getBrand(p.brand).name}</strong><br>${escapeHtml(r.reply.text)}</div>` : ''}</div>`; }).join('') : '<p class="muted">Aún no has escrito reseñas.</p>'}`;
  }

  // ---------- Favoritos ----------
  function wishlist() {
    const ids = Wishlist.ids().filter(id => getProduct(id));
    $('#p-wishlist').innerHTML = `<h2>Favoritos</h2><p class="muted">${ids.length} productos guardados. Te avisamos si bajan de precio o vuelven a stock.</p>
      <div class="products-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${ids.length ? ids.map(id => productCard(getProduct(id))).join('') : '<div class="empty-state" style="grid-column:1/-1"><p class="muted">Aún no guardas favoritos. Toca el ♡ en cualquier producto.</p><a class="btn btn-primary" href="catalog.html">Descubrir productos</a></div>'}</div>`;
  }
  document.addEventListener('store:wishlist_' + session.id, () => { if ($('#p-wishlist.active')) wishlist(); });

  // ---------- Datos personales ----------
  function profile() {
    const p = me();
    $('#p-profile').innerHTML = `<h2>Datos personales</h2>
      <form class="card" id="profForm" style="max-width:640px">
        <div class="grid-2"><div class="field"><label>Nombre</label><input class="input" name="name" value="${escapeHtml(p.name)}" required></div><div class="field"><label>Correo</label><input class="input" name="email" type="email" value="${escapeHtml(p.email)}" disabled><span class="hint">Para cambiar tu correo contacta a soporte</span></div></div>
        <div class="grid-2"><div class="field"><label>Teléfono</label><input class="input" name="phone" value="${escapeHtml(p.phone || '')}" placeholder="55 1234 5678"></div><div class="field"><label>Fecha de nacimiento</label><input class="input" name="birth" type="date" value="${p.birth || ''}"></div></div>
        <button class="btn btn-primary">Guardar cambios</button>
      </form>
      <form class="card" id="passForm" style="max-width:640px;margin-top:20px"><h4>Cambiar contraseña</h4>
        <div class="grid-2"><div class="field"><label>Contraseña actual</label><input class="input" name="cur" type="password" required></div><div class="field"><label>Nueva contraseña</label><input class="input" name="nw" type="password" minlength="6" required></div></div>
        <button class="btn btn-ghost btn-sm">Actualizar contraseña</button></form>`;
    $('#profForm').onsubmit = e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); Auth.update(p.id, { name: f.name, phone: f.phone, birth: f.birth }); toast('Datos actualizados'); $('#accName').textContent = f.name; };
    $('#passForm').onsubmit = async e => { e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); if (f.nw.length < 6) return toast('Mínimo 6 caracteres'); const r = await Auth.changePassword(f.cur, f.nw); toast(r.ok ? 'Contraseña actualizada' : r.msg); if (r.ok) e.target.reset(); };
  }

  // ---------- Direcciones ----------
  function addresses() {
    const key = 'addresses_' + session.id;
    let list = Store.get(key, null);
    if (!list) list = [];
    $('#p-addresses').innerHTML = `<h2>Direcciones</h2>
      <div class="addr-grid">${list.map((a, i) => `<div class="card addr ${i === 0 ? 'default' : ''}">${i === 0 ? '<span class="tag tag-forest" style="position:absolute;top:16px;right:16px">Predeterminada</span>' : ''}<strong>${escapeHtml(a.label)}</strong><p class="small muted" style="margin:8px 0 14px">${escapeHtml(a.fname)} ${escapeHtml(a.lname || '')}<br>${escapeHtml(a.street)}<br>${escapeHtml(a.colonia)}, C.P. ${a.cp}<br>${escapeHtml(a.city)}, ${escapeHtml(a.state)}</p><div style="display:flex;gap:14px">${i ? `<button class="link-btn" data-def="${i}">Hacer predeterminada</button>` : ''}<button class="link-btn" data-del="${i}">Eliminar</button></div></div>`).join('')}
        <form class="card" id="addrForm"><strong>Nueva dirección</strong><div style="margin-top:12px"></div>
          <div class="grid-2"><div class="field"><input class="input" name="label" placeholder="Alias (Oficina)" required></div><div class="field"><input class="input" name="fname" placeholder="Nombre completo" required></div></div>
          <div class="field"><input class="input" name="street" placeholder="Calle y número" required></div>
          <div class="grid-2"><div class="field"><input class="input" name="colonia" placeholder="Colonia" required></div><div class="field"><input class="input" name="cp" placeholder="C.P." pattern="\\d{5}" required></div></div>
          <div class="grid-2"><div class="field"><input class="input" name="city" placeholder="Ciudad" required></div><div class="field"><select class="input" name="state" required>${stateOptions()}</select></div></div>
          <button class="btn btn-outline btn-sm">Agregar dirección</button></form>
      </div>`;
    $('#addrForm [name=cp]').addEventListener('input', e => { const st = stateFromCP(e.target.value); if (e.target.value.length === 5 && st) $('#addrForm [name=state]').value = st; });
    $('#addrForm').onsubmit = e => { e.preventDefault(); list.push({ lname: '', ...Object.fromEntries(new FormData(e.target)) }); Store.set(key, list); toast('Dirección agregada'); addresses(); };
    $$('[data-del]', $('#p-addresses')).forEach(b => b.onclick = () => { list.splice(+b.dataset.del, 1); Store.set(key, list); addresses(); });
    $$('[data-def]', $('#p-addresses')).forEach(b => b.onclick = () => { const [a] = list.splice(+b.dataset.def, 1); list.unshift(a); Store.set(key, list); addresses(); });
  }

  // ---------- Preferencias ----------
  function prefs() {
    const key = 'prefs_' + session.id;
    const p = Store.get(key, { email_news: true, email_orders: true, wa_orders: true, wa_promos: false, sms: false, price_drop: true, freq: 'biweekly' });
    const rows = [['email_orders', 'Correos de pedidos', 'Confirmaciones, facturas y cambios de estado'], ['email_news', 'Newsletter', 'Nuevas marcas, lanzamientos e historias'], ['wa_orders', 'WhatsApp — envíos', 'Avisos de rastreo y entrega en tiempo real'], ['wa_promos', 'WhatsApp — promociones', 'Ofertas exclusivas y preventas'], ['price_drop', 'Alertas de precio', 'Cuando un favorito baja de precio o vuelve a stock'], ['sms', 'SMS', 'Solo avisos críticos de tu cuenta']];
    $('#p-prefs').innerHTML = `<h2>Preferencias de comunicación</h2><p class="muted">Tú decides cómo y cuándo te contactamos.</p>
      <div class="card" style="max-width:720px">${rows.map(([k, t, s]) => `<div class="toggle-row"><div><strong>${t}</strong><div class="small muted">${s}</div></div><label class="switch"><input type="checkbox" data-k="${k}" ${p[k] ? 'checked' : ''}><span></span></label></div>`).join('')}
        <div class="field" style="margin-top:20px;max-width:300px"><label>Frecuencia del newsletter</label><select class="input" id="freq"><option value="weekly">Semanal</option><option value="biweekly">Cada dos semanas</option><option value="monthly">Mensual</option></select></div></div>`;
    $('#freq').value = p.freq;
    $$('#p-prefs [data-k]').forEach(i => i.onchange = () => { p[i.dataset.k] = i.checked; Store.set(key, p); toast('Preferencias guardadas'); });
    $('#freq').onchange = e => { p.freq = e.target.value; Store.set(key, p); toast('Preferencias guardadas'); };
  }

  show((location.hash || '#overview').slice(1));
});
