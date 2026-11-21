/* =========================================================
   VibeMarket — Pantalla del VENDEDOR (marca emergente)
   Resumen · Mis productos · Subir producto · Pedidos · Devoluciones · Reseñas · Mi marca
   ========================================================= */
onReady(() => {
  const session = Auth.user();
  if (session && session.role !== 'vendor') { location.replace(ROLE_HOME[session.role]); return; }
  const bid = session && session.brandId;
  const brand = () => getBrand(bid);
  const mine = () => PRODUCTS.filter(p => p.brand === bid);
  const myOrders = () => Orders.all().filter(o => Orders.split(o)[bid]);
  const myPart = o => Orders.split(o)[bid];
  const myReturns = () => Returns.all().filter(r => (getProduct(r.productId) || {}).brand === bid);
  const myReviews = () => Reviews.all().filter(r => (getProduct(r.productId) || {}).brand === bid);
  const LOW = 3;
  const lowStock = () => mine().filter(p => p.status !== 'rejected').flatMap(p => Object.entries(p.stock).filter(([, n]) => n <= LOW).map(([k, n]) => ({ p, k, n })));

  const u = Panel.init({
    role: 'vendor', title: 'Panel de vendedor', badge: 'Marca · ' + ((getBrand(bid) || {}).name || ''),
    sections: [
      ['Mi negocio', [['overview', 'Resumen', ICONS.home], ['products', 'Mis productos', ICONS.box], ['new-product', 'Subir producto', ICONS.leaf]]],
      ['Ventas', [['orders', 'Pedidos', ICONS.truck], ['returns', 'Devoluciones', ICONS.return], ['reviews', 'Reseñas', ICONS.chat]]],
      ['Cuenta', [['brand', 'Mi marca', ICONS.settings]]],
    ],
    badges: () => ({ orders: myOrders().filter(o => ['paid', 'preparing'].includes(o.status) && o.vendorStatus?.[bid] === 'pending').length, returns: myReturns().filter(r => r.status === 'approved').length, reviews: myReviews().filter(r => !r.reply).length }),
    views: { overview, products, 'new-product': productForm, orders, returns, reviews, brandView },
  });
  if (!u) return;

  // ================= RESUMEN =================
  function overview(root) {
    const b = brand(); Panel.setTitle(`Hola, ${session.name.split(' ')[0]}`, `<button class="btn btn-accent btn-sm" onclick="Panel.go('new-product')">+ Subir producto</button>`);
    const os = myOrders().filter(o => o.status !== 'cancelled');
    const last30 = os.filter(o => (Date.now() - new Date(o.date)) / 864e5 <= 30);
    const gross = os.reduce((a, o) => a + myPart(o).subtotal, 0), net = os.reduce((a, o) => a + myPart(o).net, 0), comm = gross - net;
    const toShip = os.filter(o => ['paid', 'preparing'].includes(o.status) && o.vendorStatus?.[bid] === 'pending');
    const ps = mine();
    const units = {}; os.forEach(o => myPart(o).items.forEach(i => units[i.id] = (units[i.id] || 0) + i.qty));
    const top = Object.entries(units).sort((a, c) => c[1] - a[1]).slice(0, 5).map(([id, n]) => [getProduct(id).name, n]);
    const noReply = myReviews().filter(r => !r.reply).length;
    const alerts = [
      ...toShip.slice(0, 3).map(o => [`Pedido <strong>${o.id}</strong> listo para enviar (${myPart(o).items.length} producto/s)`, `<button class="btn btn-primary btn-xs" onclick="Panel.go('orders')">Enviar</button>`]),
      ...lowStock().slice(0, 4).map(x => [`Stock bajo: <strong>${x.p.name}</strong> · ${x.k.replace('|', ' / ').replace(/^(\w+)/, m => C[m]?.name || m)} → ${x.n} pzs`, `<button class="btn btn-ghost btn-xs" data-inv="${x.p.id}">Reponer</button>`]),
      ...ps.filter(p => p.status === 'rejected').map(p => [`<strong>${p.name}</strong> fue rechazado: ${escapeHtml(p.rejectReason || 'revisa la información')}`, `<button class="btn btn-ghost btn-xs" onclick="Panel.go('new-product', ${p.id})">Corregir</button>`]),
      ...(noReply ? [[`Tienes <strong>${noReply}</strong> reseñas sin responder`, `<button class="btn btn-ghost btn-xs" onclick="Panel.go('reviews')">Responder</button>`]] : []),
    ];
    root.innerHTML = `
      ${b.status === 'pending' ? `<div class="banner warn">${ICONS.shield.replace('<svg', '<svg width="22" height="22"')}<div><strong>Tu marca está en revisión.</strong> Ya puedes subir productos; se publicarán en la tienda cuando el equipo de VibeMarket apruebe tu marca (normalmente en 48 h).</div></div>` : ''}
      ${b.status === 'suspended' ? `<div class="banner warn"><strong>Tu marca está suspendida.</strong>&nbsp;Tus productos no son visibles. Contacta a marcas@vibemarket.mx.</div>` : ''}
      <div class="kpis">
        ${kpi('Ventas (últimos 30 días)', shortMoney(last30.reduce((a, o) => a + myPart(o).subtotal, 0)), `${last30.length} pedidos`, 'accent')}
        ${kpi('Ganancia neta acumulada', shortMoney(net), `Comisión VibeMarket ${b.commission}%: ${shortMoney(comm)}`)}
        ${kpi('Pedidos por enviar', toShip.length, toShip.length ? 'Envíalos en 48 h' : 'Todo al día ✓')}
        ${kpi('Productos publicados', ps.filter(p => p.status === 'active').length, `${ps.filter(p => p.status === 'pending_review').length} en revisión · ${ps.length} en total`)}
      </div>
      <div class="panel-grid">
        <div class="box"><h3>Ganancia neta por mes <span class="small muted" style="font-family:var(--font-sans)">después de comisión</span></h3>${barChart(monthlySeries(os, o => myPart(o).net))}</div>
        <div class="box"><h3>Requiere tu atención</h3><div class="alert-list">${alerts.length ? alerts.map(([t, a]) => `<div class="alert-item"><span class="dot"></span><span>${t}</span>${a}</div>`).join('') : '<p class="muted small">Nada pendiente. ¡Buen trabajo! 🌿</p>'}</div></div>
      </div>
      <div class="panel-grid">
        <div class="box"><h3>Productos más vendidos <span class="small muted" style="font-family:var(--font-sans)">unidades</span></h3>${top.length ? hBars(top, n => n + ' u') : '<p class="muted small">Aún no hay ventas.</p>'}</div>
        <div class="box"><h3>Tu reputación</h3>
          <div style="display:flex;gap:28px;flex-wrap:wrap">
            <div><span class="small muted">Calificación promedio</span><div style="font-family:var(--font-serif);font-size:2rem">${(myReviews().reduce((a, r) => a + r.rating, 0) / (myReviews().length || 1)).toFixed(1)} <span class="stars"><i>★</i></span></div></div>
            <div><span class="small muted">Reseñas</span><div style="font-family:var(--font-serif);font-size:2rem">${myReviews().length}</div></div>
            <div><span class="small muted">Devoluciones</span><div style="font-family:var(--font-serif);font-size:2rem">${myReturns().length}</div></div>
          </div>
          <p class="small muted" style="margin:12px 0 0">Responder reseñas y enviar a tiempo mejora tu posición en el catálogo.</p></div>
      </div>`;
    $$('[data-inv]', root).forEach(btn => btn.onclick = () => inventoryModal(+btn.dataset.inv));
  }

  // ================= MIS PRODUCTOS =================
  function products(root) {
    Panel.setTitle('Mis productos', `<button class="btn btn-accent btn-sm" onclick="Panel.go('new-product')">+ Subir producto</button>`);
    let filter = 'all', q = '';
    root.innerHTML = `<div class="toolbar-panel"><input class="input" id="pq" placeholder="Buscar en mis productos…"><div class="cat-pills" id="pf" style="margin:0">${[['all', 'Todos'], ['active', 'Publicados'], ['pending_review', 'En revisión'], ['paused', 'Pausados'], ['rejected', 'Rechazados']].map(([k, l]) => `<button class="pill ${k === 'all' ? 'active' : ''}" data-f="${k}">${l}</button>`).join('')}</div></div><div class="table-wrap"><table class="dt"><thead><tr><th>Producto</th><th>Estado</th><th>Precio</th><th>Stock</th><th>Vendidos</th><th>Calif.</th><th></th></tr></thead><tbody id="ptb"></tbody></table></div>`;
    const draw = () => {
      const list = mine().filter(p => (filter === 'all' || p.status === filter) && (!q || normalize(p.name).includes(normalize(q))));
      $('#ptb').innerHTML = list.map(p => { const st = PRODUCT_STATUS[p.status]; const s = totalStock(p); return `<tr>
        <td><div class="cell-prod"><img class="thumb" src="${productImage(p)}" alt=""><div><strong>${escapeHtml(p.name)}</strong><div class="small muted">${getCategory(p.cat).name} › ${getSub(p.sub).name} · ${p.colors.length} colores · ${p.sizes.length} tallas</div>${p.status === 'rejected' && p.rejectReason ? `<div class="err-text">Motivo: ${escapeHtml(p.rejectReason)}</div>` : ''}</div></div></td>
        <td>${pill(st[0], st[1])}</td>
        <td>${moneyShort(p.price)}${p.compareAt ? `<div class="small muted"><s>${moneyShort(p.compareAt)}</s></div>` : ''}</td>
        <td>${s <= LOW * 2 ? `<span style="color:var(--terra);font-weight:600">${s}</span>` : s}</td>
        <td>${p.sales || 0}</td><td>${ratingOf(p).count ? '★ ' + ratingOf(p).avg.toFixed(1) + ' <span class="muted small">(' + ratingOf(p).count + ')</span>' : '—'}</td>
        <td><div class="actions">
          <button class="btn btn-ghost btn-xs" data-inv="${p.id}">Inventario</button>
          <button class="btn btn-ghost btn-xs" data-edit="${p.id}">Editar</button>
          <a class="btn btn-ghost btn-xs" href="product.html?id=${p.id}" target="_blank">Ver</a>
          ${p.status === 'active' ? `<button class="btn btn-ghost btn-xs" data-pause="${p.id}">Pausar</button>` : p.status === 'paused' ? `<button class="btn btn-ghost btn-xs" data-resume="${p.id}">Reanudar</button>` : ''}
          ${p.id >= 1000 ? `<button class="btn btn-danger btn-xs" data-del="${p.id}">Eliminar</button>` : ''}
        </div></td></tr>`; }).join('') || '<tr><td colspan="7" class="muted center" style="padding:40px">No hay productos en esta vista.</td></tr>';
    };
    $('#pq').oninput = e => { q = e.target.value; draw(); };
    $$('#pf .pill').forEach(b => b.onclick = () => { filter = b.dataset.f; $$('#pf .pill').forEach(x => x.classList.toggle('active', x === b)); draw(); });
    root.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return; const id = +(t.dataset.inv || t.dataset.edit || t.dataset.pause || t.dataset.resume || t.dataset.del);
      if (t.dataset.inv) inventoryModal(id);
      if (t.dataset.edit) Panel.go('new-product', id);
      if (t.dataset.pause) { const p = getProduct(id); p.status = 'paused'; saveProduct(p); toast('Producto pausado: ya no aparece en la tienda'); draw(); }
      if (t.dataset.resume) { const p = getProduct(id); p.status = 'active'; saveProduct(p); toast('Producto publicado de nuevo'); draw(); }
      if (t.dataset.del) Panel.confirm(`¿Eliminar “${getProduct(id).name}”?`, 'Eliminar', () => { deleteProduct(id); toast('Producto eliminado'); draw(); });
    });
    draw();
  }

  function inventoryModal(id) {
    const p = getProduct(id);
    Panel.modal(`<h3>Inventario · ${escapeHtml(p.name)}</h3><p class="small muted">Actualiza las piezas disponibles por variante. Los cambios se reflejan al instante en la tienda.</p>
      <table class="stock-grid"><thead><tr><th>Color</th><th>Talla</th><th>Stock</th></tr></thead><tbody>${Object.entries(p.stock).map(([k, n]) => { const [c, s] = k.split('|'); return `<tr><td><span class="swatches" style="display:inline-flex;margin:0 6px 0 0;vertical-align:middle"><span style="background:${C[c]?.hex}"></span></span>${C[c]?.name || c}</td><td>${s}</td><td><input class="input" type="number" min="0" value="${n}" data-k="${k}"></td></tr>`; }).join('')}</tbody></table>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px"><button class="btn btn-ghost" data-close-modal>Cancelar</button><button class="btn btn-primary" id="invSave">Guardar inventario</button></div>`);
    $('#invSave').onclick = () => { $$('#pModal [data-k]').forEach(i => p.stock[i.dataset.k] = Math.max(0, parseInt(i.value) || 0)); saveProduct(p); Panel.closeModal(); toast('Inventario actualizado'); Panel.refresh(); };
  }

  // ================= SUBIR / EDITAR PRODUCTO =================
  function productForm(root, editId) {
    const editing = editId ? getProduct(editId) : null;
    if (editing && editing.brand !== bid) return Panel.go('products');
    const p = editing ? JSON.parse(JSON.stringify(editing)) : { name: '', cat: brand().mainCat || '', sub: '', desc: '', details: '', price: '', compareAt: '', cost: '', colors: [], sizes: ['Única'], stock: {}, specs: {}, features: ['Hecho en México'], weight: 500, dims: '', images: [], shape: '' };
    Panel.setTitle(editing ? 'Editar producto' : 'Subir nuevo producto');
    const specs = Object.entries(p.specs || {}); if (!specs.length) specs.push(['Material', ''], ['Medidas', ''], ['Cuidado', '']);
    root.innerHTML = `
      <form id="pForm" novalidate style="max-width:980px">
        ${!editing ? `<div class="banner ok">${ICONS.leaf.replace('<svg', '<svg width="20" height="20"')} Completa la información y envíalo a revisión. El equipo de VibeMarket lo aprueba antes de publicarlo (normalmente en menos de 24 h).</div>` : editing.status === 'rejected' ? `<div class="banner warn">Este producto fue rechazado: <strong>${escapeHtml(editing.rejectReason || '')}</strong>. Corrige y vuelve a enviarlo.</div>` : ''}
        <div class="form-section"><h4>1 · Información básica</h4>
          <div class="field"><label>Nombre del producto <span class="req">*</span></label><input class="input" name="name" maxlength="80" value="${escapeHtml(p.name)}" placeholder="Ej. Jarrón Ondas" required></div>
          <div class="grid-2">
            <div class="field"><label>Categoría <span class="req">*</span></label><select class="input" name="cat" required><option value="">Selecciona…</option>${CATEGORIES.map(c => `<option value="${c.id}" ${p.cat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
            <div class="field"><label>Subcategoría <span class="req">*</span></label><select class="input" name="sub" required></select></div>
          </div>
          <div class="field"><label>Descripción corta <span class="req">*</span></label><textarea class="input" name="desc" maxlength="300" style="min-height:80px" placeholder="Lo que el comprador ve primero: qué es y por qué es especial." required>${escapeHtml(p.desc)}</textarea><span class="hint"><span id="descN">0</span>/300</span></div>
          <div class="field"><label>Detalles del producto</label><textarea class="input" name="details" placeholder="Proceso de elaboración, historia, recomendaciones de uso…">${escapeHtml(p.details || '')}</textarea></div>
        </div>

        <div class="form-section"><h4>2 · Precio</h4>
          <div class="grid-3">
            <div class="field"><label>Precio de venta (MXN, IVA incluido) <span class="req">*</span></label><input class="input" name="price" type="number" min="1" step="1" value="${p.price}" required></div>
            <div class="field"><label>Precio anterior (para oferta)</label><input class="input" name="compareAt" type="number" min="0" step="1" value="${p.compareAt || ''}"><span class="hint">Déjalo vacío si no está en oferta</span></div>
            <div class="field"><label>Tu costo (opcional)</label><input class="input" name="cost" type="number" min="0" step="1" value=""><span class="hint">Solo para calcular tu margen; no se guarda</span></div>
          </div>
          <div class="earn-box" id="earn"></div>
        </div>

        <div class="form-section"><h4>3 · Fotos</h4>
          <label class="img-drop" id="drop"><input type="file" id="imgIn" accept="image/*" multiple hidden>
            <strong>Arrastra tus fotos aquí o haz clic para elegir</strong><div class="hint">Hasta 4 imágenes · JPG o PNG · la primera será la portada</div></label>
          <div class="img-previews" id="prev"></div>
          <div class="field" style="margin-top:14px;max-width:340px" id="shapeWrap"><label>Sin fotos todavía: usar ilustración</label><select class="input" name="shape">${Object.entries({ vase: 'Jarrón', bowl: 'Bowl', mug: 'Taza', plant: 'Maceta', candle: 'Vela', diffuser: 'Difusor', shirt: 'Prenda', bag: 'Bolsa', scarf: 'Mascada', bottle: 'Botella', soap: 'Jabón', earrings: 'Aretes', necklace: 'Collar', notebook: 'Cuaderno', print: 'Print' }).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
        </div>

        <div class="form-section"><h4>4 · Variantes y stock</h4>
          <div class="field"><label>Colores disponibles <span class="req">*</span></label><div class="chip-select" id="colorSel">${Object.entries(C).map(([k, c]) => `<label><input type="checkbox" value="${k}" ${p.colors.includes(k) ? 'checked' : ''}><span class="sw" style="background:${c.hex}"></span>${c.name}</label>`).join('')}</div></div>
          <div class="field"><label>Tallas / tamaños <span class="req">*</span></label><input class="input" id="sizesIn" value="${escapeHtml(p.sizes.join(', '))}" placeholder="Ej. S, M, L  ·  o  Chico, Grande  ·  o  Única"><span class="hint">Sepáralas con comas</span></div>
          <div id="stockWrap"></div>
        </div>

        <div class="form-section"><h4>5 · Especificaciones</h4>
          <div id="specRows">${specs.map(([k, v]) => specRow(k, v)).join('')}</div>
          <button type="button" class="btn btn-ghost btn-xs" id="addSpec">+ Agregar especificación</button>
          <div class="field" style="margin-top:18px"><label>Características</label><div class="chip-select text" id="featSel">${FEATURES.map(f => `<label><input type="checkbox" value="${f}" ${p.features.includes(f) ? 'checked' : ''}>${f}</label>`).join('')}</div></div>
        </div>

        <div class="form-section"><h4>6 · Envío</h4>
          <div class="grid-2">
            <div class="field"><label>Peso con empaque (g) <span class="req">*</span></label><input class="input" name="weight" type="number" min="1" value="${p.weight || 500}" required></div>
            <div class="field"><label>Medidas del paquete (cm)</label><input class="input" name="dims" value="${escapeHtml(p.dims || '')}" placeholder="Largo × Ancho × Alto"></div>
          </div>
        </div>
        <p class="err-text" id="formErr"></p>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="Panel.go('products')">Cancelar</button>
          ${editing ? `<a class="btn btn-ghost" href="product.html?id=${editing.id}" target="_blank">Vista previa</a>` : ''}
          <button class="btn btn-accent">${editing ? (editing.status === 'rejected' ? 'Guardar y reenviar a revisión' : 'Guardar cambios') : 'Enviar a revisión'}</button>
        </div>
      </form>`;
    const f = $('#pForm');
    if (p.shape) f.shape.value = p.shape;
    // Subcategorías dependientes
    const fillSubs = () => { const c = getCategory(f.cat.value); f.sub.innerHTML = c ? `<option value="">Selecciona…</option>` + c.subs.map(s => `<option value="${s.id}" ${p.sub === s.id ? 'selected' : ''}>${s.name}</option>`).join('') : '<option value="">Elige una categoría</option>'; };
    f.cat.onchange = () => { p.sub = ''; fillSubs(); }; fillSubs();
    f.sub.onchange = () => { if (!p.images.length && SHAPE_BY_SUB[f.sub.value]) f.shape.value = SHAPE_BY_SUB[f.sub.value]; };
    const cnt = () => $('#descN').textContent = f.desc.value.length; f.desc.oninput = cnt; cnt();
    // Ganancia estimada
    const earn = () => {
      const price = +f.price.value || 0, rate = brand().commission, com = price * rate / 100, cost = +f.cost.value || 0;
      $('#earn').innerHTML = `<div><span>Precio de venta</span><span>${money(price)}</span></div><div><span>Comisión VibeMarket (${rate}%)</span><span>−${money(com)}</span></div><div style="font-weight:600;border-top:1px solid rgba(0,0,0,.08);padding-top:6px"><span>Recibes por pieza</span><span>${money(price - com)}</span></div>${cost ? `<div class="small"><span>Margen sobre tu costo</span><span>${money(price - com - cost)} (${Math.round((price - com - cost) / price * 100) || 0}%)</span></div>` : ''}${+f.compareAt.value && +f.compareAt.value <= price ? '<div class="err-text"><span>El precio anterior debe ser mayor al precio de venta</span></div>' : ''}`;
    };
    f.price.oninput = f.cost.oninput = f.compareAt.oninput = earn; earn();
    // Fotos
    const drawPrev = () => {
      $('#prev').innerHTML = p.images.map((src, i) => `<figure><img src="${src}" alt=""><button type="button" data-rm="${i}" aria-label="Quitar">×</button>${i === 0 ? '<span class="tag" style="position:absolute;bottom:4px;left:4px;font-size:.6rem;padding:2px 6px">Portada</span>' : ''}</figure>`).join('');
      $('#shapeWrap').hidden = !!p.images.length;
      $$('#prev [data-rm]').forEach(b => b.onclick = () => { p.images.splice(+b.dataset.rm, 1); drawPrev(); });
    };
    const addFiles = async files => {
      for (const file of [...files].filter(x => x.type.startsWith('image/'))) { if (p.images.length >= 4) { toast('Máximo 4 fotos'); break; } p.images.push(await resizeImage(file)); }
      drawPrev();
    };
    $('#imgIn').onchange = e => addFiles(e.target.files);
    const drop = $('#drop');
    ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
    drawPrev();
    // Variantes → tabla de stock
    let lastSig = null;
    const drawStock = () => {
      if (!$('#sizesIn') || !$('#colorSel')) return; // el formulario ya se cerró
      const colors = $$('#colorSel input:checked').map(i => i.value);
      const sizes = [...new Set($('#sizesIn').value.split(',').map(s => s.trim()).filter(Boolean))];
      const sig = colors.join() + '#' + sizes.join('|'); if (sig === lastSig) return; lastSig = sig;
      $$('#stockWrap [data-k]').forEach(i => { if (i.value !== '') p.stock[i.dataset.k] = +i.value || 0; });
      if (!colors.length || !sizes.length) { $('#stockWrap').innerHTML = '<p class="hint">Elige al menos un color y una talla para capturar el stock.</p>'; return; }
      $('#stockWrap').innerHTML = `<label style="font-size:.85rem;font-weight:500">Stock por variante <span class="req">*</span></label>
        <div style="display:flex;gap:8px;align-items:center;margin:8px 0"><input class="input" id="allStock" type="number" min="0" placeholder="Mismo stock para todas" style="max-width:220px"><button type="button" class="btn btn-ghost btn-xs" id="applyAll">Aplicar</button></div>
        <table class="stock-grid"><thead><tr><th>Color</th><th>Talla</th><th>SKU</th><th>Piezas</th></tr></thead><tbody>${colors.flatMap(c => sizes.map(s => { const k = `${c}|${s}`; return `<tr><td><span class="swatches" style="display:inline-flex;margin:0 6px 0 0;vertical-align:middle"><span style="background:${C[c].hex}"></span></span>${C[c].name}</td><td>${escapeHtml(s)}</td><td class="small muted">VM-${(bid || '').slice(0, 3).toUpperCase()}-${c.slice(0, 3).toUpperCase()}-${normalize(s).replace(/\W/g, '').slice(0, 4).toUpperCase()}</td><td><input class="input" type="number" min="0" data-k="${k}" value="${p.stock[k] ?? ''}" placeholder="0"></td></tr>`; })).join('')}</tbody></table>
        <p class="hint" id="stockTotal"></p>`;
      const tot = () => $('#stockTotal').textContent = 'Total: ' + $$('#stockWrap [data-k]').reduce((a, i) => a + (+i.value || 0), 0) + ' piezas';
      $$('#stockWrap [data-k]').forEach(i => i.oninput = tot); tot();
      $('#applyAll').onclick = () => { $$('#stockWrap [data-k]').forEach(i => i.value = $('#allStock').value || 0); tot(); };
    };
    let tSizes; $('#colorSel').onchange = drawStock; $('#sizesIn').oninput = () => { clearTimeout(tSizes); tSizes = setTimeout(drawStock, 400); }; $('#sizesIn').onchange = drawStock; drawStock();
    // Specs
    $('#addSpec').onclick = () => { $('#specRows').insertAdjacentHTML('beforeend', specRow('', '')); };
    $('#specRows').onclick = e => { const b = e.target.closest('[data-rmspec]'); if (b) b.closest('.spec-row').remove(); };

    // Guardar
    f.onsubmit = async e => {
      e.preventDefault(); $$('.invalid', f).forEach(i => i.classList.remove('invalid'));
      const colors = $$('#colorSel input:checked').map(i => i.value);
      const sizes = [...new Set($('#sizesIn').value.split(',').map(s => s.trim()).filter(Boolean))];
      const errs = [];
      ['name', 'cat', 'sub', 'desc', 'price', 'weight'].forEach(n => { if (!String(f[n].value).trim() || (['price', 'weight'].includes(n) && +f[n].value <= 0)) { f[n].classList.add('invalid'); errs.push(n); } });
      if (f.desc.value.trim().length < 20) { f.desc.classList.add('invalid'); errs.push('desc20'); }
      if (!colors.length) errs.push('colores');
      if (!sizes.length) { $('#sizesIn').classList.add('invalid'); errs.push('tallas'); }
      const stockInputs = $$('#stockWrap [data-k]');
      const stock = {}; stockInputs.forEach(i => { if (i.value === '' || +i.value < 0) i.classList.add('invalid'); stock[i.dataset.k] = Math.max(0, parseInt(i.value) || 0); });
      if (stockInputs.some(i => i.value === '')) errs.push('stock');
      if (+f.compareAt.value && +f.compareAt.value <= +f.price.value) { f.compareAt.classList.add('invalid'); errs.push('oferta'); }
      if (errs.length) {
        const msgs = { colores: 'elige al menos un color', tallas: 'indica al menos una talla', stock: 'captura el stock de cada variante', desc20: 'la descripción corta debe tener al menos 20 caracteres', oferta: 'el precio anterior debe ser mayor al de venta' };
        $('#formErr').textContent = 'Revisa: ' + (errs.filter(x => msgs[x]).map(x => msgs[x]).join(', ') || 'los campos marcados en rojo') + '.';
        (f.querySelector('.invalid') || $('#colorSel')).scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
      }
      const specsObj = {}; $$('#specRows .spec-row').forEach(r => { const [k, v] = $$('input', r).map(i => i.value.trim()); if (k && v) specsObj[k] = v; });
      const data = {
        name: f.name.value.trim(), cat: f.cat.value, sub: f.sub.value, desc: f.desc.value.trim(), details: f.details.value.trim(),
        price: +f.price.value, compareAt: +f.compareAt.value || null, colors, sizes, stock, specs: specsObj,
        features: $$('#featSel input:checked').map(i => i.value), weight: +f.weight.value, dims: f.dims.value.trim(), images: p.images,
        shape: p.images.length ? (editing?.shape || f.shape.value) : f.shape.value,
      };
      // Sube las fotos nuevas a Supabase Storage (carpeta de la marca) y guarda sus URLs
      const saveBtn = f.querySelector('.form-actions .btn-accent'); const label = saveBtn.textContent;
      saveBtn.disabled = true; saveBtn.textContent = p.images.some(x => String(x).startsWith('data:')) && MODE === 'supabase' ? 'Subiendo fotos…' : 'Guardando…';
      try { data.images = await Media.uploadAll(p.images, bid); }
      catch (err) { saveBtn.disabled = false; saveBtn.textContent = label; $('#formErr').textContent = 'No se pudieron subir las fotos: ' + err.message; return; }
      if (editing) {
        const upd = { ...editing, ...data };
        if (editing.status === 'rejected') { upd.status = 'pending_review'; delete upd.rejectReason; }
        saveProduct(upd); toast(editing.status === 'rejected' ? 'Reenviado a revisión' : 'Cambios guardados');
      } else {
        const id = nextProductId();
        saveProduct({ id, slug: normalize(data.name).replace(/[^a-z0-9]+/g, '-'), brand: bid, ...data, sales: 0, created: new Date().toISOString().slice(0, 10), status: 'pending_review', submitted: new Date().toISOString() });
        toast('¡Producto enviado a revisión! Te avisaremos cuando se publique');
      }
      await DB.flush();
      Panel.go('products');
    };
  }
  function specRow(k, v) { return `<div class="spec-row"><input class="input" placeholder="Ej. Material" value="${escapeHtml(k)}"><input class="input" placeholder="Ej. Gres cerámico" value="${escapeHtml(v)}"><button type="button" class="icon-btn" data-rmspec aria-label="Quitar">${ICONS.close}</button></div>`; }
  function resizeImage(file, max = MODE === 'supabase' ? 1600 : 1000) { // alta calidad para el zoom (en modo local se limita por el espacio del navegador)
    return new Promise(res => {
      const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
        c.width = img.width * sc; c.height = img.height * sc; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .88));
      }; img.src = r.result; }; r.readAsDataURL(file);
    });
  }

  // ================= PEDIDOS =================
  function orders(root) {
    Panel.setTitle('Pedidos de mi marca');
    let f = 'pending';
    const vs = o => o.status === 'cancelled' ? 'cancelled' : o.status === 'pending_payment' ? 'unpaid' : (o.vendorStatus?.[bid] || 'pending');
    const VS = { pending: ['Por enviar', 'warn'], shipped: ['Enviado', 'info'], delivered: ['Entregado', 'ok'], unpaid: ['Esperando pago', 'mute'], cancelled: ['Cancelado', 'bad'] };
    root.innerHTML = `<div class="toolbar-panel"><div class="cat-pills" id="of" style="margin:0">${[['pending', 'Por enviar'], ['shipped', 'Enviados'], ['delivered', 'Entregados'], ['all', 'Todos']].map(([k, l]) => `<button class="pill ${k === f ? 'active' : ''}" data-f="${k}">${l}</button>`).join('')}</div></div>
      <div class="table-wrap"><table class="dt"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente / destino</th><th>Mis productos</th><th>Venta</th><th>Comisión</th><th>Recibes</th><th>Estado</th><th></th></tr></thead><tbody id="otb"></tbody></table></div>`;
    const draw = () => {
      const list = myOrders().filter(o => f === 'all' || vs(o) === f);
      $('#otb').innerHTML = list.map(o => { const m = myPart(o); const s = vs(o); return `<tr>
        <td><strong>${o.id}</strong></td><td>${fmtD(o.date)}</td>
        <td>${escapeHtml(o.address.name)}<div class="small muted">${escapeHtml(o.address.city)} · C.P. ${o.address.cp}</div></td>
        <td class="small">${m.items.map(i => `${getProduct(i.id).name} <span class="muted">(${C[i.color]?.name || i.color}, ${escapeHtml(i.size)})</span> ×${i.qty}`).join('<br>')}</td>
        <td>${moneyShort(m.subtotal)}</td><td class="muted">−${moneyShort(m.commission)}</td><td><strong>${moneyShort(m.net)}</strong></td>
        <td>${pill(VS[s][0], VS[s][1])}${o.vendorTracking?.[bid] ? `<div class="small muted">${o.vendorTracking[bid]}</div>` : ''}</td>
        <td><div class="actions">${s === 'pending' ? `<button class="btn btn-primary btn-xs" data-ship="${o.id}">Marcar enviado</button>` : s === 'shipped' ? `<button class="btn btn-ghost btn-xs" data-deliv="${o.id}">Marcar entregado</button>` : ''}</div></td></tr>`; }).join('') || '<tr><td colspan="9" class="muted center" style="padding:40px">No hay pedidos en esta vista.</td></tr>';
    };
    $$('#of .pill').forEach(b => b.onclick = () => { f = b.dataset.f; $$('#of .pill').forEach(x => x.classList.toggle('active', x === b)); draw(); });
    const syncOrder = o => { const st = Object.values(o.vendorStatus); if (st.every(x => x === 'delivered')) o.status = 'delivered'; else if (st.every(x => x !== 'pending')) o.status = 'shipped'; else if (o.status === 'paid') { o.status = 'preparing'; Orders.log(o, 'preparing', 'Preparando tu pedido'); } };
    root.addEventListener('click', e => {
      const sh = e.target.closest('[data-ship]'), dl = e.target.closest('[data-deliv]');
      if (sh) {
        Panel.modal(`<h3>Enviar pedido ${sh.dataset.ship}</h3><p class="small muted">Captura la guía para que el comprador pueda rastrear su paquete (recibirá aviso por correo y WhatsApp).</p>
          <div class="field"><label>Paquetería</label><select class="input" id="carrier"><option>Estafeta</option><option>DHL Express</option><option>FedEx</option><option>99minutos</option><option>Redpack</option></select></div>
          <div class="field"><label>Número de guía</label><input class="input" id="guide" placeholder="Ej. 4820019301"></div>
          <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-ghost" data-close-modal>Cancelar</button><button class="btn btn-primary" id="doShip">Confirmar envío</button></div>`);
        $('#doShip').onclick = () => {
          const g = $('#guide').value.trim(); if (!g) return $('#guide').classList.add('invalid');
          const all = Orders.all(); const o = all.find(x => x.id === sh.dataset.ship);
          o.vendorStatus[bid] = 'shipped'; o.vendorTracking = { ...(o.vendorTracking || {}), [bid]: `${$('#carrier').value} · ${g}` }; o.shipping.carrier = $('#carrier').value; o.shipping.tracking = g;
          Orders.log(o, 'shipped', 'Paquete enviado', `${brand().name} · ${$('#carrier').value}, guía ${g}`);
          syncOrder(o); Orders.save(all); Panel.closeModal(); toast('Pedido marcado como enviado'); draw(); Panel.refreshBadges();
        };
      }
      if (dl) { const all = Orders.all(); const o = all.find(x => x.id === dl.dataset.deliv); o.vendorStatus[bid] = 'delivered'; Orders.log(o, 'delivered', 'Entregado', `Productos de ${brand().name}`); syncOrder(o); Orders.save(all); toast('Pedido marcado como entregado'); draw(); }
    });
    draw();
  }

  // ================= DEVOLUCIONES =================
  function returns(root) {
    Panel.setTitle('Devoluciones');
    const list = myReturns();
    root.innerHTML = `<div class="banner ok" style="background:var(--sand);color:var(--ink-2)">VibeMarket revisa y aprueba cada solicitud. Cuando esté aprobada, el comprador te enviará la pieza con guía prepagada; confirma aquí cuando la recibas.</div>
      <div class="table-wrap"><table class="dt"><thead><tr><th>Folio</th><th>Fecha</th><th>Producto</th><th>Motivo</th><th>Monto</th><th>Estado</th><th></th></tr></thead><tbody>${list.map(r => { const p = getProduct(r.productId); return `<tr>
        <td><strong>${r.id}</strong><div class="small muted">${r.orderId}</div></td><td>${fmtD(r.date)}</td>
        <td><div class="cell-prod"><img class="thumb" src="${productImage(p, r.color)}" alt=""><div>${p.name}<div class="small muted">${C[r.color]?.name || ''} · ${escapeHtml(r.size)}</div></div></div></td>
        <td>${escapeHtml(r.reason)}${r.comment ? `<div class="small muted">“${escapeHtml(r.comment)}”</div>` : ''}</td><td>${moneyShort(r.amount)}</td>
        <td>${pill(RETURN_LABEL[r.status], RETURN_KIND[r.status])}</td>
        <td><div class="actions">${r.status === 'approved' ? `<button class="btn btn-primary btn-xs" data-recv="${r.id}">Confirmar recepción</button>` : ''}</div></td></tr>`; }).join('') || '<tr><td colspan="7" class="muted center" style="padding:40px">No tienes devoluciones. 🌿</td></tr>'}</tbody></table></div>`;
    $$('[data-recv]', root).forEach(b => b.onclick = () => { const all = Returns.all(); const r = all.find(x => x.id === b.dataset.recv); r.status = 'received'; Returns.saveAll(all); toast('Recepción confirmada. VibeMarket procesará el reembolso.'); Panel.refresh(); });
  }

  // ================= RESEÑAS =================
  function reviews(root) {
    Panel.setTitle('Reseñas de mis productos');
    const list = myReviews().filter(r => r.status === 'published').sort((a, b) => !!a.reply - !!b.reply || new Date(b.date) - new Date(a.date));
    root.innerHTML = `<div class="box">${list.map(r => { const p = getProduct(r.productId); return `<div class="review">
      <div class="review-head"><div><span class="stars"><i>${starStr(r.rating)}</i></span> <strong style="margin-left:6px">${escapeHtml(r.title)}</strong> <span class="small muted">· ${escapeHtml(p.name)}</span></div><span class="small muted">${fmtD(r.date)}</span></div>
      <p style="margin:0 0 6px">${escapeHtml(r.text)}</p><div class="small"><strong>${escapeHtml(r.name)}</strong> ${r.verified ? '<span class="verified">✓ Compra verificada</span>' : ''} · 👍 ${r.helpful}</div>
      ${r.reply ? `<div class="review-reply"><strong>Tu respuesta</strong><br>${escapeHtml(r.reply.text)}</div>` : `<form class="inline-form" data-reply="${r.id}" style="margin-top:10px"><input class="input" placeholder="Responde con amabilidad…" required><button class="btn btn-primary btn-sm">Responder</button></form>`}</div>`; }).join('') || '<p class="muted">Aún no hay reseñas.</p>'}</div>`;
    $$('[data-reply]', root).forEach(fm => fm.onsubmit = e => { e.preventDefault(); const t = $('input', fm).value.trim(); if (!t) return; const all = Reviews.all(); all.find(x => x.id === +fm.dataset.reply).reply = { text: t, date: new Date().toISOString() }; Reviews.saveAll(all); toast('Respuesta publicada'); Panel.refresh(); });
  }

  // ================= MI MARCA =================
  function brandView(root) {
    const b = brand(); Panel.setTitle('Mi marca');
    const ST = { approved: ['Aprobada', 'ok'], pending: ['En revisión', 'warn'], suspended: ['Suspendida', 'bad'], rejected: ['Rechazada', 'bad'] };
    root.innerHTML = `<div class="panel-grid">
      <form class="box" id="bForm">
        <h3>Perfil público</h3>
        <div class="grid-2"><div class="field"><label>Nombre de la marca</label><input class="input" value="${escapeHtml(b.name)}" disabled><span class="hint">Para cambiarlo contacta a VibeMarket</span></div><div class="field"><label>Ciudad</label><input class="input" name="city" value="${escapeHtml(b.city || '')}"></div></div>
        <div class="field"><label>Tagline</label><input class="input" name="tagline" maxlength="60" value="${escapeHtml(b.tagline || '')}"></div>
        <div class="field"><label>Descripción</label><textarea class="input" name="desc">${escapeHtml(b.desc || '')}</textarea></div>
        <div class="grid-3"><div class="field"><label>Color de marca</label><input class="input" name="color" type="color" value="${b.color}" style="height:46px;padding:4px"></div><div class="field"><label>Instagram</label><input class="input" name="instagram" value="${escapeHtml(b.instagram || '')}"></div><div class="field"><label>WhatsApp</label><input class="input" name="whatsapp" value="${escapeHtml(b.whatsapp || '')}"></div></div>
        <h3 style="margin-top:10px">Datos fiscales y de pago</h3>
        <div class="grid-2"><div class="field"><label>RFC</label><input class="input" name="rfc" maxlength="13" value="${escapeHtml(b.rfc || '')}"></div><div class="field"><label>CLABE</label><input class="input" name="clabe" maxlength="18" value="${escapeHtml(b.clabe || '')}"></div></div>
        <button class="btn btn-primary">Guardar cambios</button>
      </form>
      <div>
        <div class="box" style="margin-bottom:16px"><h3>Estado de la cuenta</h3>
          <div class="sum-row"><span>Estado</span>${pill(ST[b.status][0], ST[b.status][1])}</div>
          <div class="sum-row"><span>Comisión por venta</span><strong>${b.commission}%</strong></div>
          <div class="sum-row"><span>Liquidaciones</span><span>Cada 15 días vía Stripe Connect</span></div>
          <div class="sum-row"><span>Miembro desde</span><span>${b.since}</span></div></div>
        <div class="box"><h3>Así te ven los compradores</h3><div class="brand-card" style="text-align:center"><div class="brand-mono" style="background:${b.color}">${escapeHtml(b.name[0])}</div><strong>${escapeHtml(b.name)}</strong><span>${escapeHtml(b.city || '')} · desde ${b.since}</span><p class="small muted" style="margin:8px 0 0">${escapeHtml(b.tagline || '')}</p></div>
          ${b.status === 'approved' ? `<a class="btn btn-ghost btn-sm btn-block" style="margin-top:12px" href="catalog.html?brand=${b.id}" target="_blank">Ver mi tienda</a>` : ''}</div>
      </div></div>`;
    $('#bForm').onsubmit = e => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      if (d.clabe && !/^\d{18}$/.test(d.clabe)) return toast('La CLABE debe tener 18 dígitos');
      saveBrand({ ...b, ...d, rfc: d.rfc.toUpperCase() }); toast('Perfil de marca actualizado'); Panel.refresh();
    };
  }
});
