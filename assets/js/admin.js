/* =========================================================
   VibeMarket — Pantalla del ADMINISTRADOR
   Resumen · Vendedores · Compradores · Productos · Pedidos · Devoluciones · Reseñas
   ========================================================= */
onReady(() => {
  const session = Auth.user();
  if (session && session.role !== 'admin') { location.replace(ROLE_HOME[session.role]); return; }

  const buyers = () => Auth.users().filter(u => u.role === 'buyer');
  const vendorsUsers = () => Auth.users().filter(u => u.role === 'vendor');
  const orders = () => Orders.all();
  const valid = () => orders().filter(o => !['cancelled', 'refunded'].includes(o.status));
  const commOf = o => Object.values(Orders.split(o)).reduce((a, r) => a + r.commission, 0);
  const brandSales = id => valid().reduce((a, o) => a + (Orders.split(o)[id]?.subtotal || 0), 0);
  const BST = { approved: ['Aprobada', 'ok'], pending: ['Pendiente', 'warn'], suspended: ['Suspendida', 'bad'], rejected: ['Rechazada', 'bad'] };

  const u = Panel.init({
    role: 'admin', title: 'Panel de administración', badge: 'Administrador',
    sections: [
      ['General', [['overview', 'Resumen', ICONS.home]]],
      ['Usuarios', [['vendors', 'Vendedores', ICONS.leaf], ['buyers', 'Compradores', ICONS.user]]],
      ['Operación', [['products', 'Productos', ICONS.box], ['orders', 'Pedidos', ICONS.truck], ['returns', 'Devoluciones', ICONS.return], ['reviews', 'Reseñas', ICONS.chat]]],
      ['Atención', [['messages', 'Mensajes', ICONS.mail]]],
    ],
    badges: () => ({ vendors: BRANDS.filter(b => b.status === 'pending').length, products: PRODUCTS.filter(p => p.status === 'pending_review').length, returns: Returns.all().filter(r => ['requested', 'received'].includes(r.status)).length, messages: Messages.all().filter(m => m.status === 'new').length }),
    views: { overview, vendors, buyers: buyersView, products, orders: ordersView, returns, reviews, messages },
  });
  if (!u) return;

  // ================= RESUMEN =================
  function overview(root) {
    Panel.setTitle('Resumen de la plataforma', `<span class="small muted">Actualizado ${new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>`);
    const bs = buyers(), os = valid(), gmv = os.reduce((a, o) => a + o.totals.subtotal, 0), comm = os.reduce((a, o) => a + commOf(o), 0);
    const m30 = os.filter(o => (Date.now() - new Date(o.date)) / 864e5 <= 30), prev30 = os.filter(o => { const d = (Date.now() - new Date(o.date)) / 864e5; return d > 30 && d <= 60; });
    const g30 = m30.reduce((a, o) => a + o.totals.subtotal, 0), gp = prev30.reduce((a, o) => a + o.totals.subtotal, 0);
    const delta = gp ? Math.round((g30 - gp) / gp * 100) : 0;
    const newBuyers = bs.filter(b => (Date.now() - new Date(b.since)) / 864e5 <= 30).length;
    const pendingBrands = BRANDS.filter(b => b.status === 'pending'), pendingProducts = PRODUCTS.filter(p => p.status === 'pending_review');
    const rets = Returns.all(), openRets = rets.filter(r => ['requested', 'received'].includes(r.status));
    const lowStock = activeProducts().filter(p => totalStock(p) <= 6);
    const catSales = CATEGORIES.map(c => [c.name, os.reduce((a, o) => a + o.items.filter(i => getProduct(i.id)?.cat === c.id).reduce((s, i) => s + (i.price ?? getProduct(i.id).price) * i.qty, 0), 0)]).sort((a, b) => b[1] - a[1]);
    const topBrands = BRANDS.filter(b => b.status === 'approved').map(b => [b.name, brandSales(b.id), b.color]).sort((a, b) => b[1] - a[1]);
    const alerts = [
      ...pendingBrands.map(b => [`Nueva marca por aprobar: <strong>${escapeHtml(b.name)}</strong> (${escapeHtml(b.city || '')})`, `<button class="btn btn-primary btn-xs" onclick="Panel.go('vendors')">Revisar</button>`]),
      ...(pendingProducts.length ? [[`<strong>${pendingProducts.length}</strong> productos esperan moderación`, `<button class="btn btn-primary btn-xs" onclick="Panel.go('products')">Moderar</button>`]] : []),
      ...(Messages.all().filter(m => m.status === 'new').length ? [[`<strong>${Messages.all().filter(m => m.status === 'new').length}</strong> mensajes de contacto sin responder`, `<button class="btn btn-primary btn-xs" onclick="Panel.go('messages')">Responder</button>`]] : []),
      ...(openRets.length ? [[`<strong>${openRets.length}</strong> devoluciones requieren acción`, `<button class="btn btn-ghost btn-xs" onclick="Panel.go('returns')">Ver</button>`]] : []),
      ...(lowStock.length ? [[`<strong>${lowStock.length}</strong> productos publicados con stock bajo`, `<button class="btn btn-ghost btn-xs" onclick="Panel.go('products')">Ver</button>`]] : []),
      ...(orders().filter(o => o.status === 'pending_payment').length ? [[`<strong>${orders().filter(o => o.status === 'pending_payment').length}</strong> pedidos con pago OXXO pendiente`, `<button class="btn btn-ghost btn-xs" onclick="Panel.go('orders')">Ver</button>`]] : []),
    ];
    root.innerHTML = `
      <div class="kpis">
        ${kpi('Ventas totales (GMV)', shortMoney(gmv), `${delta >= 0 ? '+' : '−'}${Math.abs(delta)}% vs. 30 días previos`, 'accent')}
        ${kpi('Ingresos por comisión', shortMoney(comm), `${(comm / (gmv || 1) * 100).toFixed(1)}% promedio`)}
        ${kpi('Compradores registrados', bs.length, `+${newBuyers} en 30 días · ${bs.filter(b => b.status === 'suspended').length} suspendidos`)}
        ${kpi('Vendedores (marcas)', BRANDS.filter(b => b.status === 'approved').length, `${pendingBrands.length} pendientes de aprobación`)}
        ${kpi('Pedidos', orders().length, `${m30.length} en los últimos 30 días`)}
        ${kpi('Ticket promedio', moneyShort(Math.round(gmv / (os.length || 1))), `${(os.reduce((a, o) => a + o.items.reduce((s, i) => s + i.qty, 0), 0) / (os.length || 1)).toFixed(1)} piezas por pedido`)}
        ${kpi('Productos publicados', activeProducts().length, `${pendingProducts.length} en revisión`)}
        ${kpi('Devoluciones', rets.length, `${openRets.length} abiertas · tasa ${(rets.length / (orders().length || 1) * 100).toFixed(1)}%`)}
      </div>
      <div class="panel-grid">
        <div class="box"><h3>Ventas por mes</h3>${barChart(monthlySeries(os, o => o.totals.subtotal))}</div>
        <div class="box"><h3>Requiere atención</h3><div class="alert-list">${alerts.length ? alerts.map(([t, a]) => `<div class="alert-item"><span class="dot"></span><span>${t}</span>${a}</div>`).join('') : '<p class="muted small">Todo en orden ✓</p>'}</div></div>
      </div>
      <div class="panel-grid">
        <div class="box"><h3>Ventas por marca</h3>${hBars(topBrands)}</div>
        <div class="box"><h3>Ventas por categoría</h3>${hBars(catSales)}</div>
      </div>
      <div class="box"><h3>Pedidos recientes <button class="link-btn" onclick="Panel.go('orders')">Ver todos →</button></h3>
        <div class="table-wrap" style="border:0"><table class="dt"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Marcas</th><th>Total</th><th>Comisión</th><th>Estado</th></tr></thead><tbody>
        ${orders().slice(0, 6).map(o => `<tr><td><strong>${o.id}</strong></td><td>${fmtD(o.date)}</td><td>${escapeHtml(o.address.name)}</td><td class="small">${Object.keys(Orders.split(o)).map(b => getBrand(b)?.name).join(', ')}</td><td>${moneyShort(o.totals.total)}</td><td>${moneyShort(commOf(o))}</td><td>${pill(STATUS_LABEL[o.status], ORDER_KIND[o.status])}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  // ================= VENDEDORES =================
  function vendors(root) {
    Panel.setTitle('Vendedores', `<span class="small muted">${BRANDS.length} marcas registradas</span>`);
    let f = BRANDS.some(b => b.status === 'pending') ? 'pending' : 'all', q = '';
    root.innerHTML = `<div class="toolbar-panel"><input class="input" id="vq" placeholder="Buscar marca, ciudad o correo…"><div class="cat-pills" id="vf" style="margin:0">${[['all', 'Todas'], ['pending', 'Pendientes'], ['approved', 'Aprobadas'], ['suspended', 'Suspendidas']].map(([k, l]) => `<button class="pill ${k === f ? 'active' : ''}" data-f="${k}">${l} (${k === 'all' ? BRANDS.length : BRANDS.filter(b => b.status === k).length})</button>`).join('')}</div></div>
      <div class="table-wrap"><table class="dt"><thead><tr><th>Marca</th><th>Responsable</th><th>Productos</th><th>Ventas</th><th>Comisión %</th><th>Estado</th><th></th></tr></thead><tbody id="vtb"></tbody></table></div>`;
    const draw = () => {
      const list = BRANDS.filter(b => (f === 'all' || b.status === f) && (!q || normalize(`${b.name} ${b.city} ${b.owner}`).includes(normalize(q))));
      $('#vtb').innerHTML = list.map(b => { const owner = Auth.find(b.owner) || {}; const ps = PRODUCTS.filter(p => p.brand === b.id); return `<tr>
        <td><div class="cell-prod"><span class="brand-mono" style="width:40px;height:40px;font-size:1rem;margin:0;background:${b.color}">${escapeHtml(b.name[0])}</span><div><strong>${escapeHtml(b.name)}</strong><div class="small muted">${escapeHtml(b.city || '')} · ${escapeHtml(b.tagline || '')}</div>${b.status === 'pending' && b.desc ? `<div class="small" style="max-width:340px;margin-top:4px">${escapeHtml(b.desc)}</div>` : ''}${b.rfc ? `<div class="small muted">RFC ${escapeHtml(b.rfc)}</div>` : ''}</div></div></td>
        <td>${escapeHtml(owner.name || '—')}<div class="small muted">${escapeHtml(b.owner || '')}</div><div class="small muted">${escapeHtml(owner.phone || b.whatsapp || '')}</div></td>
        <td>${ps.filter(p => p.status === 'active').length} publicados<div class="small muted">${ps.filter(p => p.status === 'pending_review').length} en revisión</div></td>
        <td>${moneyShort(brandSales(b.id))}</td>
        <td><input class="input" type="number" min="0" max="40" step="0.5" value="${b.commission}" data-comm="${b.id}" style="width:80px"></td>
        <td>${pill(BST[b.status][0], BST[b.status][1])}${b.note ? `<div class="small muted">${escapeHtml(b.note)}</div>` : ''}</td>
        <td><div class="actions">
          ${b.status === 'pending' ? `<button class="btn btn-ok btn-xs" data-act="approve" data-id="${b.id}">Aprobar</button><button class="btn btn-danger btn-xs" data-act="reject" data-id="${b.id}">Rechazar</button>` : ''}
          ${b.status === 'approved' ? `<button class="btn btn-danger btn-xs" data-act="suspend" data-id="${b.id}">Suspender</button>` : ''}
          ${['suspended', 'rejected'].includes(b.status) ? `<button class="btn btn-ghost btn-xs" data-act="reactivate" data-id="${b.id}">Reactivar</button>` : ''}
          <button class="btn btn-ghost btn-xs" data-act="products" data-id="${b.id}">Productos</button>
        </div></td></tr>`; }).join('') || '<tr><td colspan="7" class="muted center" style="padding:40px">Sin resultados.</td></tr>';
    };
    $('#vq').oninput = e => { q = e.target.value; draw(); };
    $$('#vf .pill').forEach(b => b.onclick = () => { f = b.dataset.f; $$('#vf .pill').forEach(x => x.classList.toggle('active', x === b)); draw(); });
    root.addEventListener('change', e => { const i = e.target.closest('[data-comm]'); if (!i) return; const b = getBrand(i.dataset.comm); b.commission = Math.max(0, Math.min(40, +i.value || 0)); saveBrand(b); toast(`Comisión de ${b.name}: ${b.commission}%`); });
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-act]'); if (!t) return; const b = getBrand(t.dataset.id);
      const set = (status, msg, note) => { b.status = status; b.note = note || ''; saveBrand(b); const ow = Auth.find(b.owner); if (ow) Auth.update(ow.id, { status: status === 'suspended' ? 'suspended' : 'active' }); toast(msg); draw(); Panel.refreshBadges(); };
      if (t.dataset.act === 'approve') Panel.confirm(`¿Aprobar la marca “${b.name}”?`, 'Aprobar marca', () => set('approved', `${b.name} aprobada. Ya puede vender.`));
      if (t.dataset.act === 'reject') Panel.confirm(`Rechazar “${b.name}”`, 'Rechazar', n => set('rejected', 'Solicitud rechazada', n), 'Motivo (se enviará a la marca)');
      if (t.dataset.act === 'suspend') Panel.confirm(`¿Suspender “${b.name}”? Sus productos dejarán de mostrarse.`, 'Suspender', n => set('suspended', 'Marca suspendida', n), 'Motivo interno');
      if (t.dataset.act === 'reactivate') set('approved', 'Marca reactivada');
      if (t.dataset.act === 'products') Panel.go('products', { brand: b.id });
    });
    draw();
  }

  // ================= COMPRADORES =================
  function buyersView(root) {
    const bs = buyers();
    Panel.setTitle('Compradores', `<span class="small muted">${bs.length} registrados</span>`);
    let q = '';
    const stats = b => { const os = orders().filter(o => o.email.toLowerCase() === b.email.toLowerCase()); const v = os.filter(o => o.status !== 'cancelled'); return { n: os.length, spent: v.reduce((a, o) => a + o.totals.total, 0), last: os[0]?.date, rets: Returns.all().filter(r => r.email === b.email).length }; };
    const guests = [...new Set(orders().filter(o => !Auth.find(o.email)).map(o => o.email))].length;
    root.innerHTML = `<div class="kpis">${kpi('Compradores registrados', bs.length)}${kpi('Activos (compraron en 90 días)', bs.filter(b => { const s = stats(b); return s.last && (Date.now() - new Date(s.last)) / 864e5 <= 90; }).length)}${kpi('Compras como invitado', guests, 'correos únicos')}${kpi('Gasto promedio por comprador', moneyShort(Math.round(bs.reduce((a, b) => a + stats(b).spent, 0) / (bs.length || 1))))}</div>
      <div class="toolbar-panel"><input class="input" id="bq" placeholder="Buscar por nombre, correo o ciudad…"></div>
      <div class="table-wrap"><table class="dt"><thead><tr><th>Comprador</th><th>Ciudad</th><th>Registro</th><th>Pedidos</th><th>Total gastado</th><th>Último pedido</th><th>Devol.</th><th>Estado</th><th></th></tr></thead><tbody id="btb"></tbody></table></div>`;
    const draw = () => {
      $('#btb').innerHTML = bs.filter(b => !q || normalize(`${b.name} ${b.email} ${b.city || ''}`).includes(normalize(q))).map(b => { const s = stats(b); return `<tr>
        <td><div class="cell-prod"><span class="avatar sm">${escapeHtml(b.name[0])}</span><div><strong>${escapeHtml(b.name)}</strong><div class="small muted">${escapeHtml(b.email)}</div></div></div></td>
        <td>${escapeHtml(b.city || '—')}</td><td>${fmtD(b.since)}</td><td>${s.n}</td><td>${moneyShort(s.spent)}</td><td>${s.last ? fmtD(s.last) : '—'}</td><td>${s.rets}</td>
        <td>${b.status === 'suspended' ? pill('Suspendido', 'bad') : pill('Activo', 'ok')}</td>
        <td><div class="actions">${b.status === 'suspended' ? `<button class="btn btn-ghost btn-xs" data-st="active" data-id="${b.id}">Reactivar</button>` : `<button class="btn btn-danger btn-xs" data-st="suspended" data-id="${b.id}">Suspender</button>`}<button class="btn btn-ghost btn-xs" data-ord="${escapeHtml(b.email)}">Pedidos</button></div></td></tr>`; }).join('');
    };
    $('#bq').oninput = e => { q = e.target.value; draw(); };
    root.addEventListener('click', e => {
      const s = e.target.closest('[data-st]'), o = e.target.closest('[data-ord]');
      if (s) { Auth.update(s.dataset.id, { status: s.dataset.st }); toast(s.dataset.st === 'suspended' ? 'Comprador suspendido: no podrá iniciar sesión' : 'Comprador reactivado'); buyersView(root); }
      if (o) Panel.go('orders', { q: o.dataset.ord });
    });
    draw();
  }

  // ================= PRODUCTOS =================
  function products(root, arg) {
    Panel.setTitle('Productos');
    let f = arg?.brand ? 'all' : PRODUCTS.some(p => p.status === 'pending_review') ? 'pending_review' : 'all', q = '', brandF = arg?.brand || '';
    root.innerHTML = `<div class="toolbar-panel"><input class="input" id="pq" placeholder="Buscar producto…"><select class="input" id="pb" style="max-width:200px"><option value="">Todas las marcas</option>${BRANDS.map(b => `<option value="${b.id}" ${b.id === brandF ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}</select>
      <div class="cat-pills" id="pf" style="margin:0">${[['all', 'Todos'], ['pending_review', 'En revisión'], ['active', 'Publicados'], ['paused', 'Pausados'], ['rejected', 'Rechazados']].map(([k, l]) => `<button class="pill ${k === f ? 'active' : ''}" data-f="${k}">${l} (${k === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.status === k).length})</button>`).join('')}</div></div>
      <div class="table-wrap"><table class="dt"><thead><tr><th>Producto</th><th>Marca</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Vendidos</th><th>Estado</th><th></th></tr></thead><tbody id="ptb"></tbody></table></div>`;
    const draw = () => {
      const list = PRODUCTS.filter(p => (f === 'all' || p.status === f) && (!brandF || p.brand === brandF) && (!q || normalize(p.name).includes(normalize(q)))).sort((a, b) => (b.status === 'pending_review') - (a.status === 'pending_review'));
      $('#ptb').innerHTML = list.map(p => { const st = PRODUCT_STATUS[p.status]; const b = getBrand(p.brand) || {}; return `<tr>
        <td><div class="cell-prod"><img class="thumb" src="${productImage(p)}" alt=""><div><strong>${escapeHtml(p.name)}</strong><div class="small muted" style="max-width:320px">${escapeHtml(p.desc).slice(0, 110)}${p.desc.length > 110 ? '…' : ''}</div>${p.status === 'pending_review' ? `<div class="small muted">${p.colors.length} colores · ${p.sizes.join(', ')} · ${Object.keys(p.specs || {}).length} especificaciones · ${(p.images || []).length} fotos</div>` : ''}</div></div></td>
        <td>${escapeHtml(b.name || p.brand)}${b.status !== 'approved' ? `<div>${pill('Marca ' + (BST[b.status] || ['?'])[0].toLowerCase(), 'warn')}</div>` : ''}</td>
        <td class="small">${getCategory(p.cat).name}<br><span class="muted">${getSub(p.sub).name}</span></td>
        <td>${moneyShort(p.price)}</td><td>${totalStock(p)}</td><td>${p.sales || 0}</td>
        <td>${pill(st[0], st[1])}${p.rejectReason ? `<div class="small muted">${escapeHtml(p.rejectReason)}</div>` : ''}</td>
        <td><div class="actions"><a class="btn btn-ghost btn-xs" href="product.html?id=${p.id}" target="_blank">Ver</a>
          ${p.status === 'pending_review' ? `<button class="btn btn-ok btn-xs" data-act="approve" data-id="${p.id}">Aprobar</button><button class="btn btn-danger btn-xs" data-act="reject" data-id="${p.id}">Rechazar</button>` : ''}
          ${p.status === 'active' ? `<button class="btn btn-danger btn-xs" data-act="pause" data-id="${p.id}">Desactivar</button>` : ''}
          ${p.status === 'paused' ? `<button class="btn btn-ghost btn-xs" data-act="approve" data-id="${p.id}">Activar</button>` : ''}
        </div></td></tr>`; }).join('') || '<tr><td colspan="8" class="muted center" style="padding:40px">No hay productos en esta vista.</td></tr>';
    };
    $('#pq').oninput = e => { q = e.target.value; draw(); };
    $('#pb').onchange = e => { brandF = e.target.value; draw(); };
    $$('#pf .pill').forEach(b => b.onclick = () => { f = b.dataset.f; $$('#pf .pill').forEach(x => x.classList.toggle('active', x === b)); draw(); });
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-act]'); if (!t) return; const p = getProduct(t.dataset.id);
      const set = (st, msg, reason) => { p.status = st; if (reason !== undefined) p.rejectReason = reason; else delete p.rejectReason; if (st === 'active' && !p.published) p.published = new Date().toISOString(); saveProduct(p); toast(msg); draw(); Panel.refreshBadges(); };
      if (t.dataset.act === 'approve') set('active', getBrand(p.brand)?.status === 'approved' ? `“${p.name}” publicado en la tienda` : `“${p.name}” aprobado (se verá cuando la marca sea aprobada)`);
      if (t.dataset.act === 'reject') Panel.confirm(`Rechazar “${p.name}”`, 'Rechazar producto', n => set('rejected', 'Producto rechazado; la marca recibirá el motivo', n || 'No cumple los lineamientos'), 'Motivo para la marca (ej. faltan fotos, precio incorrecto)');
      if (t.dataset.act === 'pause') Panel.confirm(`¿Desactivar “${p.name}”? Dejará de verse en la tienda.`, 'Desactivar', () => set('paused', 'Producto desactivado'));
    });
    draw();
  }

  // ================= PEDIDOS =================
  function ordersView(root, arg) {
    Panel.setTitle('Pedidos');
    let f = 'all', q = arg?.q || '';
    root.innerHTML = `<div class="toolbar-panel"><input class="input" id="oq" placeholder="Buscar por pedido, cliente o correo…" value="${escapeHtml(q)}"><select class="input" id="of" style="max-width:200px"><option value="all">Todos los estados</option>${Object.entries(STATUS_LABEL).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select><span class="small muted" id="ocount"></span></div>
      <div class="table-wrap"><table class="dt"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Marcas</th><th>Pago</th><th>Total</th><th>Comisión</th><th>Estado</th></tr></thead><tbody id="otb"></tbody></table></div>`;
    const draw = () => {
      const list = orders().filter(o => (f === 'all' || o.status === f) && (!q || normalize(`${o.id} ${o.email} ${o.address.name}`).includes(normalize(q))));
      $('#ocount').textContent = `${list.length} pedidos · ${moneyShort(list.reduce((a, o) => a + o.totals.total, 0))}`;
      $('#otb').innerHTML = list.slice(0, 150).map(o => `<tr><td><strong>${o.id}</strong>${o.guest ? '<div class="small muted">Invitado</div>' : ''}</td><td>${fmtD(o.date)}</td><td>${escapeHtml(o.address.name)}<div class="small muted">${escapeHtml(o.email)}</div></td>
        <td class="small">${Object.entries(Orders.split(o)).map(([b, r]) => `${escapeHtml(getBrand(b)?.name || b)} <span class="muted">${moneyShort(r.subtotal)}</span>`).join('<br>')}</td>
        <td class="small">${escapeHtml(o.payment?.label || { card: 'Tarjeta', paypal: 'PayPal', mercadopago: 'Mercado Pago', oxxo: 'OXXO' }[o.payment?.method] || '—')}${o.payment?.simulated ? '<div class="muted" style="font-size:.72rem">simulado</div>' : ''}</td><td>${moneyShort(o.totals.total)}</td><td>${moneyShort(commOf(o))}</td>
        <td><select class="input" data-ost="${o.id}" style="width:150px">${Object.entries(STATUS_LABEL).map(([k, l]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="8" class="muted center" style="padding:40px">Sin pedidos.</td></tr>';
    };
    $('#oq').oninput = e => { q = e.target.value; draw(); };
    $('#of').onchange = e => { f = e.target.value; draw(); };
    root.addEventListener('change', e => { const s = e.target.closest('[data-ost]'); if (!s) return; const prevSt = Orders.get(s.dataset.ost).status; Orders.setStatus(s.dataset.ost, s.value, s.value === 'paid' && prevSt === 'pending_payment' ? 'Pago confirmado' : STATUS_LABEL[s.value], 'Actualizado por VibeMarket'); toast(`${s.dataset.ost}: ${STATUS_LABEL[s.value]}`); });
    draw();
  }

  // ================= DEVOLUCIONES =================
  function returns(root) {
    Panel.setTitle('Devoluciones');
    const draw = () => {
      const list = Returns.all();
      root.innerHTML = `<div class="table-wrap"><table class="dt"><thead><tr><th>Folio</th><th>Fecha</th><th>Comprador</th><th>Producto / marca</th><th>Motivo</th><th>Monto</th><th>Estado</th><th></th></tr></thead><tbody>${list.map(r => { const p = getProduct(r.productId); return `<tr>
        <td><strong>${r.id}</strong><div class="small muted">${r.orderId}</div></td><td>${fmtD(r.date)}</td><td class="small">${escapeHtml(r.email)}</td>
        <td><div class="cell-prod"><img class="thumb" src="${productImage(p, r.color)}" alt=""><div>${escapeHtml(p.name)}<div class="small muted">${escapeHtml(getBrand(p.brand)?.name || '')}</div></div></div></td>
        <td>${escapeHtml(r.reason)}${r.comment ? `<div class="small muted">“${escapeHtml(r.comment)}”</div>` : ''}</td><td>${moneyShort(r.amount)}</td>
        <td>${pill(RETURN_LABEL[r.status], RETURN_KIND[r.status])}${r.adminNote ? `<div class="small muted">${escapeHtml(r.adminNote)}</div>` : ''}</td>
        <td><div class="actions">
          ${r.status === 'requested' ? `<button class="btn btn-ok btn-xs" data-ra="approved" data-id="${r.id}">Aprobar</button><button class="btn btn-danger btn-xs" data-ra="rejected" data-id="${r.id}">Rechazar</button>` : ''}
          ${['approved', 'received'].includes(r.status) ? `<button class="btn btn-primary btn-xs" data-ra="refunded" data-id="${r.id}">Reembolsar</button>` : ''}
        </div></td></tr>`; }).join('') || '<tr><td colspan="8" class="muted center" style="padding:40px">Sin devoluciones.</td></tr>'}</tbody></table></div>`;
    };
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-ra]'); if (!t) return;
      const apply = note => { const all = Returns.all(); const r = all.find(x => x.id === t.dataset.id); r.status = t.dataset.ra; if (note) r.adminNote = note; Returns.saveAll(all); toast({ approved: 'Devolución aprobada: se envió la guía al comprador', rejected: 'Devolución rechazada', refunded: `Reembolso de ${money(r.amount)} enviado (Stripe refund)` }[r.status]); draw(); Panel.refreshBadges(); };
      if (t.dataset.ra === 'rejected') Panel.confirm('Rechazar devolución', 'Rechazar', apply, 'Motivo para el comprador'); else apply('');
    });
    draw();
  }

  // ================= RESEÑAS =================
  function reviews(root) {
    Panel.setTitle('Moderación de reseñas');
    let f = 'all';
    root.innerHTML = `<div class="toolbar-panel"><div class="cat-pills" id="rf" style="margin:0"><button class="pill active" data-f="all">Todas</button><button class="pill" data-f="low">1–3 estrellas</button><button class="pill" data-f="hidden">Ocultas</button><button class="pill" data-f="noreply">Sin respuesta de la marca</button></div></div><div class="box" id="rl"></div>`;
    const draw = () => {
      const list = Reviews.all().filter(r => f === 'all' ? true : f === 'low' ? r.rating <= 3 : f === 'hidden' ? r.status === 'hidden' : !r.reply).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 80);
      $('#rl').innerHTML = list.map(r => { const p = getProduct(r.productId) || { name: '?' }; return `<div class="review" style="${r.status === 'hidden' ? 'opacity:.55' : ''}"><div class="review-head"><div><span class="stars"><i>${starStr(r.rating)}</i></span> <strong style="margin-left:6px">${escapeHtml(r.title)}</strong> <span class="small muted">· ${escapeHtml(p.name)} · ${escapeHtml(getBrand(p.brand)?.name || '')}</span></div>
        <div style="display:flex;gap:8px;align-items:center"><span class="small muted">${fmtD(r.date)}</span>${r.status === 'hidden' ? `<button class="btn btn-ghost btn-xs" data-rv="published" data-id="${r.id}">Publicar</button>` : `<button class="btn btn-danger btn-xs" data-rv="hidden" data-id="${r.id}">Ocultar</button>`}</div></div>
        <p style="margin:0 0 6px">${escapeHtml(r.text)}</p><div class="small">${escapeHtml(r.name)}${r.email ? ' · ' + escapeHtml(r.email) : ''} ${r.verified ? '<span class="verified">✓ Compra verificada</span>' : ''} · 👍 ${r.helpful}</div>${r.reply ? `<div class="review-reply"><strong>Respuesta de la marca</strong><br>${escapeHtml(r.reply.text)}</div>` : ''}</div>`; }).join('') || '<p class="muted">Sin reseñas en esta vista.</p>';
    };
    $$('#rf .pill').forEach(b => b.onclick = () => { f = b.dataset.f; $$('#rf .pill').forEach(x => x.classList.toggle('active', x === b)); draw(); });
    root.addEventListener('click', e => { const t = e.target.closest('[data-rv]'); if (!t) return; const all = Reviews.all(); all.find(x => x.id === +t.dataset.id).status = t.dataset.rv; Reviews.saveAll(all); toast(t.dataset.rv === 'hidden' ? 'Reseña oculta' : 'Reseña publicada'); draw(); });
    draw();
  }
  // ================= MENSAJES DE CONTACTO =================
  function messages(root) {
    Panel.setTitle('Mensajes de contacto', `<a class="btn btn-ghost btn-sm" href="${CONTACT.gmail('VibeMarket')}" target="_blank" rel="noopener">Abrir Gmail</a>`);
    let f = Messages.all().some(m => m.status === 'new') ? 'new' : 'all';
    const ST = { new: ['Nuevo', 'warn'], answered: ['Respondido', 'ok'], closed: ['Cerrado', 'mute'] };
    root.innerHTML = `<div class="toolbar-panel"><div class="cat-pills" id="mf" style="margin:0">${[['new', 'Nuevos'], ['answered', 'Respondidos'], ['closed', 'Cerrados'], ['all', 'Todos']].map(([k, l]) => `<button class="pill ${k === f ? 'active' : ''}" data-f="${k}">${l} (${k === 'all' ? Messages.all().length : Messages.all().filter(m => m.status === k).length})</button>`).join('')}</div></div><div id="ml"></div>`;
    const draw = () => {
      const list = Messages.all().filter(m => f === 'all' || m.status === f).sort((a, b) => new Date(b.date) - new Date(a.date));
      $('#ml').innerHTML = list.map(m => {
        const reBody = `Hola ${m.name.split(' ')[0]},\n\n${m.reply || ''}\n\n— Equipo VibeMarket\n\n> ${m.message.replace(/\n/g, '\n> ')}`;
        const gmailTo = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent('Re: ' + (m.topic || 'Tu mensaje a VibeMarket') + (m.orderRef ? ' · ' + m.orderRef : ''))}&body=${encodeURIComponent(reBody)}`;
        return `<div class="box" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><strong>${escapeHtml(m.name)}</strong> <span class="small muted">· ${escapeHtml(m.email)}</span><div class="small muted">${escapeHtml(m.topic || 'Sin motivo')}${m.orderRef ? ' · Pedido ' + escapeHtml(m.orderRef) : ''} · ${fmtD(m.date)}</div></div>${pill(ST[m.status][0], ST[m.status][1])}</div>
          <p style="margin:12px 0;white-space:pre-line">${escapeHtml(m.message)}</p>
          <div class="field" style="margin-bottom:10px"><textarea class="input" data-reply="${m.id}" placeholder="Escribe tu respuesta (se guarda en el historial)…" style="min-height:70px">${escapeHtml(m.reply || '')}</textarea></div>
          <div class="actions" style="justify-content:flex-start">
            <a class="btn btn-primary btn-xs" href="${gmailTo}" target="_blank" rel="noopener" data-gmail="${m.id}">Responder por Gmail</a>
            <button class="btn btn-ghost btn-xs" data-mst="answered" data-id="${m.id}">Marcar respondido</button>
            ${m.status !== 'closed' ? `<button class="btn btn-ghost btn-xs" data-mst="closed" data-id="${m.id}">Cerrar</button>` : ''}
            <button class="btn btn-danger btn-xs" data-mdel="${m.id}">Eliminar</button>
          </div></div>`;
      }).join('') || '<div class="box"><p class="muted" style="margin:0">No hay mensajes en esta vista.</p></div>';
    };
    const saveReply = id => { const t = $(`[data-reply="${id}"]`); if (t) Messages.update(+id, { reply: t.value.trim() }); };
    $$('#mf .pill').forEach(b => b.onclick = () => { f = b.dataset.f; $$('#mf .pill').forEach(x => x.classList.toggle('active', x === b)); draw(); });
    root.addEventListener('click', e => {
      const st = e.target.closest('[data-mst]'), del = e.target.closest('[data-mdel]'), gm = e.target.closest('[data-gmail]');
      if (gm) { saveReply(gm.dataset.gmail); Messages.update(+gm.dataset.gmail, { status: 'answered' }); setTimeout(() => { draw(); Panel.refreshBadges(); }, 300); }
      if (st) { saveReply(st.dataset.id); Messages.update(+st.dataset.id, { status: st.dataset.mst }); toast(st.dataset.mst === 'closed' ? 'Mensaje cerrado' : 'Marcado como respondido'); draw(); Panel.refreshBadges(); }
      if (del) Panel.confirm('¿Eliminar este mensaje?', 'Eliminar', () => { DB.remove('messages', +del.dataset.mdel); toast('Mensaje eliminado'); draw(); Panel.refreshBadges(); });
    });
    root.addEventListener('input', e => { const t = e.target.closest('[data-reply]'); if (!t) return; const a = $(`[data-gmail="${t.dataset.reply}"]`); const m = Messages.all().find(x => x.id === +t.dataset.reply);
      a.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}&su=${encodeURIComponent('Re: ' + (m.topic || 'Tu mensaje a VibeMarket'))}&body=${encodeURIComponent(`Hola ${m.name.split(' ')[0]},\n\n${t.value}\n\n— Equipo VibeMarket`)}`; });
    draw();
  }
});
