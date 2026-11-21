/* VibeMarket — Página de producto: galería con zoom, variantes, stock en tiempo real, reseñas */
onReady(() => {
  const p = getProduct(qs('id'));
  const viewer = Auth.user();
  if (!p) { $('main').innerHTML = '<div class="empty-state"><h2>Producto no encontrado</h2><p class="muted">Puede que ya no exista o que el enlace sea incorrecto.</p><a class="btn btn-primary" href="catalog.html">Ir al catálogo</a></div>'; return; }
  if (p.status !== 'active') {
    const canPreview = viewer && (viewer.role === 'admin' || (viewer.role === 'vendor' && viewer.brandId === p.brand));
    if (!canPreview) { $('main').innerHTML = '<div class="empty-state"><h2>Este producto no está disponible</h2><p class="muted">Puede estar en revisión o haber sido retirado.</p><a class="btn btn-primary" href="catalog.html">Ir al catálogo</a></div>'; return; }
    $('#crumbs').insertAdjacentHTML('afterend', `<div class="banner warn">Vista previa: este producto está <strong>${p.status === 'pending_review' ? 'en revisión' : p.status === 'rejected' ? 'rechazado' : 'pausado'}</strong> y no es visible para los compradores.</div>`);
  }
  const brand = getBrand(p.brand), cat = getCategory(p.cat), sub = getSub(p.sub);
  const firstAvail = p.colors.find(c => p.sizes.some(s => p.stock[`${c}|${s}`] > 0)) || p.colors[0];
  const state = { color: firstAvail, size: p.sizes.find(s => p.stock[`${firstAvail}|${s}`] > 0) || p.sizes[0], view: 0, qty: 1 };

  document.title = `${p.name} · ${brand.name} — VibeMarket`;
  const r0 = ratingOf(p);
  $('#crumbs').innerHTML = `<a href="index.html">Inicio</a><span>/</span><a href="catalog.html?cat=${cat.id}">${cat.name}</a><span>/</span><a href="catalog.html?cat=${cat.id}&sub=${sub.id}">${sub.name}</a><span>/</span><span>${escapeHtml(p.name)}</span>`;
  $('#brandLink').href = `catalog.html?brand=${brand.id}`;
  $('#brandLink').innerHTML = `<span class="brand-mono" style="width:26px;height:26px;font-size:.8rem;margin:0;background:${brand.color}">${escapeHtml(brand.name[0])}</span>${escapeHtml(brand.name)}${brand.city ? ' · ' + escapeHtml(brand.city) : ''}`;
  $('#pName').textContent = p.name;
  $('#pRating').innerHTML = r0.count ? `<i>${starStr(r0.avg)}</i> ${r0.avg.toFixed(1)} · ${r0.count} ${r0.count === 1 ? 'reseña' : 'reseñas'}` : 'Sin reseñas todavía · sé la primera persona en opinar';
  const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
  $('#pPrice').innerHTML = `${money(p.price)}${p.compareAt ? `<s>${moneyShort(p.compareAt)}</s> <span class="tag tag-terra" style="vertical-align:middle">-${off}%</span>` : ''}`;
  $('#pInstallments').textContent = p.price >= 600 ? `o 3 meses sin intereses de ${moneyShort((p.price / 3).toFixed(2))}` : 'Impuestos incluidos';
  $('#pShort').textContent = p.desc;
  $('#zoomHint').innerHTML = `${ICONS.zoom} Pasa el cursor para ampliar`;
  $('#perks').innerHTML = [
    [ICONS.truck, `Envío gratis desde ${moneyShort(FREE_SHIPPING_MIN)} · Llega en 3–5 días`],
    [ICONS.return, 'Devoluciones gratuitas durante 30 días'],
    [ICONS.leaf, `${p.features.join(' · ')}`],
    [ICONS.shield, 'Compra protegida · Pago seguro'],
  ].map(([i, t]) => `<div>${i}<span>${t}</span></div>`).join('');

  // ---------- Galería + zoom ----------
  const renderGallery = () => {
    const src = productImage(p, state.color, state.view);
    $('#mainImg').src = src; $('#mainImg').alt = `${p.name} — ${C[state.color].name}`;
    $('#zoomLens').style.backgroundImage = `url("${src}")`;
    $('#thumbs').innerHTML = [0, 1, 2, 3].map(v => `<button class="${v === state.view ? 'active' : ''}" data-v="${v}" aria-label="Vista ${v + 1}"><img src="${productImage(p, state.color, v)}" alt=""></button>`).join('');
  };
  $('#thumbs').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { state.view = +b.dataset.v; renderGallery(); } });
  const zb = $('#zoomBox');
  zb.addEventListener('mousemove', e => {
    const r = zb.getBoundingClientRect();
    $('#zoomLens').style.backgroundPosition = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });

  // ---------- Variantes + stock ----------
  const stockOf = (c = state.color, s = state.size) => p.stock[`${c}|${s}`] ?? 0;
  const renderOptions = () => {
    $('#colorName').textContent = C[state.color].name;
    $('#sizeName').textContent = state.size;
    $('#colorOpts').innerHTML = p.colors.map(c => `<button class="${c === state.color ? 'active' : ''}" data-c="${c}" style="background:${C[c].hex}" title="${C[c].name}" aria-label="${C[c].name}"></button>`).join('');
    $('#sizeOpts').innerHTML = p.sizes.map(s => `<button class="${s === state.size ? 'active' : ''} ${stockOf(state.color, s) ? '' : 'soldout'}" data-s="${s}">${s}</button>`).join('');
    const n = stockOf(), box = $('#stockBox');
    box.className = 'stock' + (n === 0 ? ' out' : n <= 5 ? ' low' : '');
    box.innerHTML = `<span class="pulse"></span>` + (n === 0 ? 'Agotado en esta variante — <a href="#" class="link-btn" style="color:inherit" id="notifyMe">Avísame cuando vuelva</a>' : n <= 5 ? `¡Quedan solo ${n} piezas! Ordena pronto` : `En stock · ${n} disponibles · Envío en 24 h`);
    $('#addBtn').disabled = $('#buyNow').disabled = n === 0;
    $('#qInput').max = n; if (state.qty > n) { state.qty = Math.max(1, n); $('#qInput').value = state.qty; }
    $('#notifyMe')?.addEventListener('click', e => { e.preventDefault(); toast('Te avisaremos por correo cuando vuelva 📩'); });
  };
  $('#colorOpts').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; state.color = b.dataset.c; if (!stockOf()) state.size = p.sizes.find(s => stockOf(state.color, s)) || state.size; renderOptions(); renderGallery(); });
  $('#sizeOpts').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; state.size = b.dataset.s; renderOptions(); });
  $('#qMinus').onclick = () => { state.qty = Math.max(1, state.qty - 1); $('#qInput').value = state.qty; };
  $('#qPlus').onclick = () => { state.qty = Math.min(stockOf() || 1, state.qty + 1); $('#qInput').value = state.qty; if (state.qty === stockOf()) toast(`Máximo disponible: ${stockOf()}`); };
  $('#qInput').onchange = e => { state.qty = Math.max(1, Math.min(stockOf(), +e.target.value || 1)); e.target.value = state.qty; };
  $('#addBtn').onclick = () => { if (Cart.add(p.id, state.color, state.size, state.qty)) { toast(`${p.name} (${C[state.color].name}, ${state.size}) agregado`); openMiniCart(); } };
  $('#buyNow').onclick = () => { if (Cart.add(p.id, state.color, state.size, state.qty)) location.href = 'checkout.html'; };
  const renderWish = () => { $('#wishBtn').innerHTML = ICONS.heart; $('#wishBtn').classList.toggle('on', Wishlist.has(p.id)); $('#wishBtn').querySelector('svg').style.fill = Wishlist.has(p.id) ? 'var(--terra)' : 'none'; $('#wishBtn').style.color = Wishlist.has(p.id) ? 'var(--terra)' : ''; };
  $('#wishBtn').onclick = () => { Wishlist.toggle(p.id); renderWish(); };

  // Stock en tiempo real: si otra pestaña/usuario compra, api.js recarga la vista (evento "storage").
  // Con Supabase se puede activar Realtime sobre la tabla products para ver el stock al instante
  const renderViewers = () => { const sold = p.sales || 0; $('#viewers').innerHTML = sold ? `${ICONS.check.replace('<svg', '<svg width="16" height="16"')} ${sold} ${sold === 1 ? 'pieza vendida' : 'piezas vendidas'}` : ''; };

  // ---------- Tabs ----------
  $$('.tabs button').forEach(b => b.onclick = () => {
    $$('.tabs button').forEach(x => x.classList.toggle('active', x === b));
    $$('.tab-panel').forEach(t => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
  });
  $('#pRating').onclick = () => $('[data-tab=rev]').click();
  $('#tab-desc').innerHTML = `<div style="max-width:720px"><p>${escapeHtml(p.desc)}</p>${p.details ? `<p style="white-space:pre-line">${escapeHtml(p.details)}</p>` : ''}<p>Diseñado y producido por <strong>${escapeHtml(brand.name)}</strong>${brand.city ? `, marca emergente de ${escapeHtml(brand.city)}` : ''}${brand.since ? ` fundada en ${brand.since}` : ''}.${brand.tagline ? ' ' + escapeHtml(brand.tagline) + '.' : ''} Al comprar aquí, el ${100 - (brand.commission ?? DEFAULT_COMMISSION)}% del precio va directamente a la marca.</p><div style="display:flex;gap:8px;flex-wrap:wrap">${(p.features || []).map(f => `<span class="tag tag-forest">${escapeHtml(f)}</span>`).join('')}</div></div>`;
  $('#specsTable').innerHTML = Object.entries({ Marca: brand.name, ...p.specs, SKU: `VM-${String(p.id).padStart(4, '0')}-${state.color.slice(0, 3).toUpperCase()}` }).map(([k, v]) => `<tr><td>${escapeHtml(k.replace('_', ' '))}</td><td>${escapeHtml(v)}</td></tr>`).join('');

  // ---------- Reseñas de compradores ----------
  const allReviews = () => Reviews.all();
  const myOrders = viewer && viewer.role === 'buyer' ? Orders.all().filter(o => o.email === viewer.email) : [];
  const boughtIt = myOrders.some(o => o.status !== 'cancelled' && o.items.some(i => i.id === p.id));
  let revSort = 'helpful', revFilter = 0;
  const renderReviews = () => {
    const list = allReviews().filter(r => r.productId === p.id && r.status === 'published');
    const total = list.length;
    const avg = total ? list.reduce((a, r) => a + r.rating, 0) / total : 0;
    const dist = [5, 4, 3, 2, 1].map(s => list.filter(r => r.rating === s).length / (list.length || 1));
    const recPct = Math.round(list.filter(r => r.rating >= 4).length / (list.length || 1) * 100);
    $('#revCount').textContent = `(${total})`;
    $('#pRating').innerHTML = total ? `<i>${starStr(avg)}</i> ${avg.toFixed(1)} · ${total} ${total === 1 ? 'reseña' : 'reseñas'}` : 'Sin reseñas todavía · sé la primera persona en opinar';
    $('#ratingBig').textContent = (avg || 0).toFixed(1);
    $('#ratingStars').innerHTML = `<i>${starStr(avg)}</i> ${total} reseñas`;
    $('#ratingBars').innerHTML = [5, 4, 3, 2, 1].map((st, i) => `<div style="cursor:pointer" data-star="${st}" title="Filtrar ${st} estrellas"><span>${st}★</span><span class="bar"><span style="width:${dist[i] * 100}%"></span></span><span class="muted">${Math.round(dist[i] * total)}</span></div>`).join('');
    $$('#ratingBars [data-star]').forEach(d => d.onclick = () => { revFilter = revFilter === +d.dataset.star ? 0 : +d.dataset.star; renderReviews(); });
    const voted = Store.get('voted_' + (viewer ? viewer.id : 'guest'), []);
    const shown = list.filter(r => !revFilter || r.rating === revFilter).sort(revSort === 'recent' ? (a, b) => new Date(b.date) - new Date(a.date) : revSort === 'high' ? (a, b) => b.rating - a.rating : revSort === 'low' ? (a, b) => a.rating - b.rating : (a, b) => b.helpful - a.helpful);
    $('#reviewList').innerHTML = `
      <div class="rec-strip">${ICONS.check.replace('<svg', '<svg width="18" height="18"')} <span><strong>${recPct}%</strong> de los compradores recomiendan este producto</span></div>
      <div class="toolbar" style="margin-bottom:6px"><span class="small muted">${shown.length} reseñas${revFilter ? ` de ${revFilter}★ · <button class="link-btn" id="clrStar">ver todas</button>` : ''}</span>
        <select id="revSort" class="input" style="max-width:200px;padding:8px 12px"><option value="helpful">Más útiles</option><option value="recent">Más recientes</option><option value="high">Mejor calificación</option><option value="low">Peor calificación</option></select></div>
      ${shown.map(r => `<article class="review"><div class="review-head"><div><span class="stars"><i>${starStr(r.rating)}</i></span> <strong style="margin-left:6px">${escapeHtml(r.title)}</strong></div><span class="muted small">${new Date(r.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
        <p style="margin:0 0 8px">${escapeHtml(r.text)}</p>
        <div class="small" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><strong>${escapeHtml(r.name)}</strong> ${r.verified ? '<span class="verified">✓ Compra verificada</span>' : ''}
          <button class="helpful-btn ${voted.includes(r.id) ? 'on' : ''}" data-help="${r.id}">👍 Útil (${r.helpful})</button></div>
        ${r.reply ? `<div class="review-reply"><strong>Respuesta de ${escapeHtml(brand.name)}</strong><br>${escapeHtml(r.reply.text)}</div>` : ''}</article>`).join('') || '<p class="muted">Aún no hay reseñas con este filtro.</p>'}`;
    $('#revSort').value = revSort; $('#revSort').onchange = e => { revSort = e.target.value; renderReviews(); };
    $('#clrStar')?.addEventListener('click', () => { revFilter = 0; renderReviews(); });
    $$('[data-help]').forEach(b => b.onclick = async () => {
      if (!viewer) return toast('Inicia sesión para marcar reseñas como útiles');
      const id = +b.dataset.help, key = 'voted_' + viewer.id, v = Store.get(key, []);
      if (v.includes(id)) return toast('Ya marcaste esta reseña como útil');
      try { await Reviews.vote(id); Store.set(key, [...v, id]); renderReviews(); } catch (err) { toast(err.message); }
    });
  };
  document.addEventListener('store:reviews', () => renderReviews()); // datos confirmados por el servidor (p. ej. compra verificada)
  // Formulario: solo compradores con sesión
  const formCard = $('#reviewForm').closest('.card');
  if (!viewer || viewer.role !== 'buyer') {
    formCard.innerHTML = `<h4 style="margin-bottom:8px">¿Lo compraste?</h4><p class="small muted">Las reseñas las escriben compradores registrados para mantenerlas confiables.</p><a class="btn btn-primary btn-sm btn-block" href="login.html?role=buyer&next=${encodeURIComponent('product.html?id=' + p.id)}">Inicia sesión como comprador</a>`;
  } else if (allReviews().some(r => r.productId === p.id && r.userId === viewer.id)) {
    formCard.innerHTML = '<h4>¡Gracias por tu reseña!</h4><p class="small muted" style="margin:0">Ya calificaste este producto.</p>';
  } else {
    formCard.querySelector('h4').insertAdjacentHTML('afterend', `<p class="small ${boughtIt ? '' : 'muted'}" style="margin-top:-6px">${boughtIt ? '✓ Tu reseña aparecerá como <strong>compra verificada</strong>' : 'Aún no compras este producto; tu reseña no llevará la marca de compra verificada.'}</p>`);
    formCard.querySelector('[name=name]').value = viewer.name.split(' ')[0] + (viewer.name.split(' ')[1] ? ' ' + viewer.name.split(' ')[1][0] + '.' : '');
  }
  $('#reviewForm')?.addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target); const all = allReviews();
    all.unshift({ id: Date.now(), productId: p.id, userId: viewer.id, name: f.get('name'), title: f.get('title'), text: f.get('text'), rating: +f.get('r'), date: new Date().toISOString(), verified: boughtIt, helpful: 0, status: 'published', reply: null, mine: true });
    Reviews.saveAll(all); formCard.innerHTML = '<h4>¡Gracias por tu reseña!</h4><p class="small muted" style="margin:0">Ya está publicada y ayudará a otros compradores.</p>'; revSort = 'recent'; renderReviews(); toast('¡Gracias! Tu reseña fue publicada');
  });

  // ---------- Relacionados + vistos recientemente ----------
  const related = activeProducts().filter(x => x.id !== p.id).map(x => [x, (x.cat === p.cat ? 3 : 0) + (x.brand === p.brand ? 2 : 0) + x.features.filter(f => p.features.includes(f)).length]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
  if (related.length) $('#related').innerHTML = related.map(productCard).join(''); else $('#related').closest('section').hidden = true;
  // Clientes que compraron esto también compraron (co-ocurrencia en pedidos)
  const co = {};
  Orders.all().filter(o => o.items.some(i => i.id === p.id)).forEach(o => o.items.forEach(i => { if (i.id !== p.id) co[i.id] = (co[i.id] || 0) + 1; }));
  const together = Object.entries(co).sort((a, b) => b[1] - a[1]).map(([id]) => getProduct(id)).filter(x => x && x.status === 'active').slice(0, 4);
  if (together.length) { $('#alsoWrap').hidden = false; $('#also').innerHTML = together.map(productCard).join(''); }
  const recent = Store.get('recent', []).filter(id => id !== p.id && getProduct(id));
  const recentShown = recent.map(getProduct).filter(x => x.status === 'active').slice(0, 4);
  if (recentShown.length) { $('#recentWrap').hidden = false; $('#recent').innerHTML = recentShown.map(productCard).join(''); }
  Store.set('recent', [p.id, ...recent].slice(0, 8));

  renderGallery(); renderOptions(); renderWish(); renderViewers(); renderReviews();
});
