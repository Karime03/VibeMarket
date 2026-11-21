/* VibeMarket — Homepage (todo se calcula a partir de datos reales; vacío al inicio) */
onReady(() => {
  const products = activeProducts();
  const brands = BRANDS.filter(b => b.status === 'approved');
  const emptyBox = (title, text, cta) => `<div class="empty-state card" style="grid-column:1/-1;padding:48px 24px"><h3>${title}</h3><p class="muted" style="max-width:460px;margin:0 auto 18px">${text}</p>${cta || ''}</div>`;
  const sellCta = '<a href="login.html?role=vendor" class="btn btn-accent btn-sm">Vende con nosotros</a>';

  // Hero: ilustraciones decorativas + cifras reales
  $('#heroVisual').insertAdjacentHTML('afterbegin', [['vase', 'terracota', 0], ['candle', 'ambar', 3], ['shirt', 'hueso', 3]]
    .map(([sh, c, v], i) => `<a href="catalog.html" class="p-img" aria-hidden="true" tabindex="-1"><img src="${illustration(sh, c, v, i + 1)}" alt=""></a>`).join(''));
  const reviews = Reviews.all().filter(r => r.status === 'published');
  const stats = [
    [brands.length, brands.length === 1 ? 'Marca emergente' : 'Marcas emergentes'],
    [products.length, products.length === 1 ? 'Producto publicado' : 'Productos publicados'],
    [reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) + '★' : '—', 'Calificación promedio'],
  ];
  $('#heroStats').innerHTML = stats.map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join('');

  // Garantías (políticas de la tienda)
  $('#trustRow').innerHTML = [
    [ICONS.truck, 'Envío gratis', `En compras desde ${moneyShort(FREE_SHIPPING_MIN)}`],
    [ICONS.return, 'Devoluciones 30 días', 'Sin costo para ti'],
    [ICONS.shield, 'Pago 100% seguro', 'Stripe · PayPal · Mercado Pago'],
    [ICONS.leaf, 'Comercio justo', `${100 - DEFAULT_COMMISSION}% del precio va a la marca`],
  ].map(([i, t, s]) => `<div class="trust-item"><span class="ico">${i}</span><div><strong>${t}</strong><span>${s}</span></div></div>`).join('');

  // Categorías (taxonomía fija; conteos reales)
  $('#catGrid').innerHTML = CATEGORIES.map(c => {
    const n = products.filter(p => p.cat === c.id).length;
    return `<a href="catalog.html?cat=${c.id}" class="cat-card"><img src="${categoryImage(c.id)}" alt=""><div><h3>${c.name}</h3><span>${c.desc} · ${n ? n + (n === 1 ? ' producto' : ' productos') : 'Próximamente'}</span></div></a>`;
  }).join('');

  // Destacados
  const sorters = {
    popular: (a, b) => (b.sales || 0) - (a.sales || 0) || new Date(b.published || b.created) - new Date(a.published || a.created),
    rated: (a, b) => ratingOf(b).avg - ratingOf(a).avg || ratingOf(b).count - ratingOf(a).count,
  };
  const renderFeatured = k => {
    const list = (k === 'new' ? newProducts() : [...products].sort(sorters[k])).slice(0, 8);
    $('#featuredGrid').innerHTML = list.length ? list.map(productCard).join('')
      : emptyBox('Aún no hay productos publicados', 'Las marcas emergentes están preparando sus primeras piezas. ¿Tienes una marca? Súmate y publica tus productos.', sellCta);
  };
  renderFeatured('popular');
  $$('#featuredTabs .pill').forEach(b => b.onclick = () => {
    $$('#featuredTabs .pill').forEach(x => x.classList.toggle('active', x === b)); renderFeatured(b.dataset.f);
  });

  // Ofertas (solo si hay productos con precio anterior)
  const deals = products.filter(p => p.compareAt && p.compareAt > p.price)
    .sort((a, b) => (b.compareAt - b.price) / b.compareAt - (a.compareAt - a.price) / a.compareAt).slice(0, 3);
  if (!deals.length) {
    $('#dealsSection h2').textContent = 'Ofertas de temporada';
    $('#dealsSection p.muted').textContent = 'Aquí aparecen los productos con precio rebajado. Las marcas activan una oferta agregando un "precio anterior" a su producto.';
    $('#countdown').hidden = true;
    $('#dealsGrid').innerHTML = emptyBox('Aún no hay ofertas activas', 'Vuelve pronto: cuando una marca rebaje un producto lo verás primero aquí.', '<a href="catalog.html" class="btn btn-outline btn-sm">Ver catálogo</a>');
  } else {
    $('#dealsGrid').innerHTML = deals.map(productCard).join('');
    const max = Math.max(...deals.map(p => Math.round((1 - p.price / p.compareAt) * 100)));
    $('#dealsSection h2').textContent = `Hasta ${max}% en piezas seleccionadas`;
    const end = new Date(); end.setDate(end.getDate() + ((7 - end.getDay()) % 7 || 7)); end.setHours(23, 59, 59, 0);
    const tick = () => {
      let s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      $('#countdown').innerHTML = [['Días', 86400], ['Horas', 3600], ['Min', 60], ['Seg', 1]].map(([l, d]) => { const v = Math.floor(s / d); s %= d; return `<div><strong>${String(v).padStart(2, '0')}</strong><span>${l}</span></div>`; }).join('');
    };
    tick(); setInterval(tick, 1000);
  }

  // Marcas
  if (!brands.length) $('#brandsRow').innerHTML = emptyBox('Sé de las primeras marcas', 'Registra tu marca, sube tus productos y empieza a vender cuando el equipo apruebe tu solicitud.', sellCta);
  else $('#brandsRow').innerHTML = brands.map(b => `<a href="catalog.html?brand=${encodeURIComponent(b.id)}" class="brand-card"><div class="brand-mono" style="background:${b.color}">${escapeHtml(b.name[0])}</div><strong>${escapeHtml(b.name)}</strong><span>${escapeHtml(b.city || '')}${b.since ? ' · desde ' + b.since : ''}</span></a>`).join('');

  // Recomendado para ti (comprador con sesión)
  const u = Auth.user();
  if (u && u.role === 'buyer' && products.length) {
    const seen = [...Wishlist.ids(), ...Store.get('recent', []), ...Orders.all().filter(o => o.email === u.email).flatMap(o => o.items.map(i => i.id))];
    const cats = {}; seen.forEach(id => { const p = getProduct(id); if (p) cats[p.cat] = (cats[p.cat] || 0) + 1; });
    const owned = new Set(seen);
    const recs = products.filter(p => !owned.has(p.id)).sort((a, b) => (cats[b.cat] || 0) - (cats[a.cat] || 0) || ratingOf(b).avg - ratingOf(a).avg).slice(0, 4);
    if (recs.length) {
      $('#recoWrap').hidden = false;
      $('#recoTitle').textContent = `Recomendado para ti, ${u.name.split(' ')[0]}`;
      $('#recoGrid').innerHTML = recs.map(productCard).join('');
    }
  }

  // Reseñas reales mejor valoradas (sección oculta si aún no hay)
  const best = reviews.filter(r => r.rating >= 4 && r.text && getProduct(r.productId)).sort((a, b) => b.helpful - a.helpful || b.rating - a.rating).slice(0, 3);
  if (!best.length) $('#testimonials').innerHTML = [
      [ICONS.shield, 'Reseñas verificadas', 'Solo compradores con cuenta pueden opinar, y marcamos quién compró de verdad.'],
      [ICONS.chat, 'Opiniones reales', 'Aún no hay reseñas publicadas. Las primeras opiniones de la comunidad aparecerán aquí.'],
      [ICONS.return, 'Compra sin riesgo', 'Si algo no te convence, tienes 30 días para devolverlo sin costo.'],
    ].map(([i, t, d]) => `<figure class="testi" style="margin:0"><span class="ico" style="width:44px;height:44px;border-radius:50%;background:var(--forest-soft);color:var(--forest);display:grid;place-items:center">${i.replace('<svg', '<svg width="20" height="20"')}</span><blockquote style="font-size:1.05rem">${t}</blockquote><footer class="muted small">${d}</footer></figure>`).join('');
  else $('#testimonials').innerHTML = best.map(r => { const p = getProduct(r.productId); return `<figure class="testi" style="margin:0"><span class="stars"><i>${starStr(r.rating)}</i></span><blockquote>“${escapeHtml(r.text)}”</blockquote><footer><span class="avatar">${escapeHtml(r.name[0])}</span><div><strong>${escapeHtml(r.name)}</strong><div class="muted small">sobre <a href="product.html?id=${p.id}" class="link-btn">${escapeHtml(p.name)}</a>${r.verified ? ' · compra verificada' : ''}</div></div></footer></figure>`; }).join('');

  // Newsletter → se guarda como suscriptor (tabla newsletter_subscribers)
  $('#nlForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#nlEmail').value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    $('#nlMsg').textContent = ok ? `¡Listo! Te enviaremos tu código BIENVENIDA15 a ${email} ✨` : 'Por favor ingresa un correo válido.';
    $('#nlMsg').style.color = ok ? '#CFE3D4' : '#F2B8A2';
    if (ok) {
      const interests = $$('.nl-prefs input:checked').map(i => i.parentElement.textContent.trim());
      try { await Newsletter.subscribe(email, interests); e.target.reset(); }
      catch (err) { $('#nlMsg').textContent = 'No se pudo registrar tu correo: ' + err.message; $('#nlMsg').style.color = '#F2B8A2'; }
    }
  });
});
