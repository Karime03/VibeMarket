/* VibeMarket — Catálogo: navegación, filtros, orden, vista y búsqueda */
onReady(() => {
  const state = {
    cat: qs('cat') || '', sub: qs('sub') || '', q: qs('q') || '',
    brands: qs('brand') ? [qs('brand')] : [], features: [], colors: [],
    min: null, max: null, rating: 0, deals: qs('ofertas') === '1' || qs('deals') === '1', inStock: false,
    newOnly: qs('nuevo') === '1' || qs('sort') === 'newest',
    sort: qs('sort') && qs('sort') !== 'newest' ? qs('sort') : qs('nuevo') === '1' || qs('sort') === 'newest' ? 'newest' : qs('ofertas') === '1' ? 'discount' : 'popular', view: Store.get('view', 'grid'),
  };

  $('#openFilters').insertAdjacentHTML('afterbegin', ICONS.filter + ' ');
  $('#viewGrid').innerHTML = ICONS.grid; $('#viewList').innerHTML = ICONS.list;
  $('#sortSel').value = state.sort;
  $('#fDeals').checked = state.deals;
  if (state.q) $('#globalSearch').value = state.q;

  // Árbol de categorías
  const ALL = activeProducts();
  const count = fn => ALL.filter(fn).length;
  $('#catTree').innerHTML = `<li><a href="#" data-cat="" data-sub="">Todo <span class="count">${ALL.length}</span></a></li>` +
    CATEGORIES.map(c => `<li><a href="#" data-cat="${c.id}" data-sub="">${c.name} <span class="count">${count(p => p.cat === c.id)}</span></a>
      <ul>${c.subs.map(s => `<li><a href="#" data-cat="${c.id}" data-sub="${s.id}">${s.name} <span class="count">${count(p => p.sub === s.id)}</span></a></li>`).join('')}</ul></li>`).join('');
  $('#brandFilters').innerHTML = BRANDS.filter(b => b.status === 'approved').map(b => `<label class="check"><input type="checkbox" value="${b.id}" ${state.brands.includes(b.id) ? 'checked' : ''}> ${escapeHtml(b.name)} <span class="count" style="margin-left:auto">${count(p => p.brand === b.id)}</span></label>`).join('');
  $('#featFilters').innerHTML = FEATURES.map(f => `<label class="check"><input type="checkbox" value="${f}"> ${f}</label>`).join('');
  const usedColors = [...new Set(ALL.flatMap(p => p.colors))];
  $('#colorFilters').innerHTML = usedColors.map(c => `<button class="color-dot" data-color="${c}" style="background:${C[c].hex}" title="${C[c].name}" aria-label="${C[c].name}"></button>`).join('');

  // Eventos
  $('#catTree').addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); state.cat = a.dataset.cat; state.sub = a.dataset.sub; render(); });
  $('#brandFilters').addEventListener('change', () => { state.brands = $$('#brandFilters input:checked').map(i => i.value); render(); });
  $('#featFilters').addEventListener('change', () => { state.features = $$('#featFilters input:checked').map(i => i.value); render(); });
  $('#colorFilters').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if (!b) return; const c = b.dataset.color; state.colors = state.colors.includes(c) ? state.colors.filter(x => x !== c) : [...state.colors, c]; render(); });
  $('#pMin').addEventListener('input', e => { state.min = e.target.value ? +e.target.value : null; render(); });
  $('#pMax').addEventListener('input', e => { state.max = e.target.value ? +e.target.value : null; $('#pRange').value = state.max || 1500; render(); });
  $('#pRange').addEventListener('input', e => { state.max = +e.target.value >= 1500 ? null : +e.target.value; $('#pMax').value = state.max ?? ''; render(); });
  $$('input[name=rating]').forEach(r => r.addEventListener('change', () => { state.rating = +r.value; render(); }));
  $('#fDeals').addEventListener('change', e => { state.deals = e.target.checked; render(); });
  $('#fStock').addEventListener('change', e => { state.inStock = e.target.checked; render(); });
  $('#sortSel').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#viewGrid').onclick = () => { state.view = 'grid'; Store.set('view', 'grid'); render(); };
  $('#viewList').onclick = () => { state.view = 'list'; Store.set('view', 'list'); render(); };
  $('#clearFilters').onclick = () => {
    Object.assign(state, { cat: '', sub: '', q: '', brands: [], features: [], colors: [], min: null, max: null, rating: 0, deals: false, inStock: false, newOnly: false });
    $$('#filters input[type=checkbox]').forEach(i => i.checked = false); $('#pMin').value = $('#pMax').value = ''; $('#pRange').value = 1500;
    $('input[name=rating][value="0"]').checked = true; render();
  };
  $('#openFilters').onclick = () => { $('#filters').classList.add('open'); $('#backdrop').classList.add('open'); };
  $('#applyMobile').onclick = closeDrawers;
  $('#activeFilters').addEventListener('click', e => {
    const b = e.target.closest('[data-rm]'); if (!b) return;
    const [k, v] = b.dataset.rm.split(':');
    if (k === 'cat') { state.cat = ''; state.sub = ''; }
    else if (k === 'sub') state.sub = '';
    else if (k === 'q') { state.q = ''; $('#globalSearch').value = ''; }
    else if (k === 'brand') { state.brands = state.brands.filter(x => x !== v); $(`#brandFilters input[value="${v}"]`).checked = false; }
    else if (k === 'feat') { state.features = state.features.filter(x => x !== v); $(`#featFilters input[value="${v}"]`).checked = false; }
    else if (k === 'color') state.colors = state.colors.filter(x => x !== v);
    else if (k === 'price') { state.min = state.max = null; $('#pMin').value = $('#pMax').value = ''; $('#pRange').value = 1500; }
    else if (k === 'deals') { state.deals = false; $('#fDeals').checked = false; }
    else if (k === 'new') state.newOnly = false;
    else if (k === 'stock') { state.inStock = false; $('#fStock').checked = false; }
    else if (k === 'rating') { state.rating = 0; $('input[name=rating][value="0"]').checked = true; }
    render();
  });

  function filtered() {
    const nq = normalize(state.q);
    const base = state.newOnly ? newProducts() : ALL;
    let list = base.filter(p =>
      (!state.cat || p.cat === state.cat) && (!state.sub || p.sub === state.sub) &&
      (!state.brands.length || state.brands.includes(p.brand)) &&
      (!state.features.length || state.features.every(f => p.features.includes(f))) &&
      (!state.colors.length || p.colors.some(c => state.colors.includes(c))) &&
      (state.min == null || p.price >= state.min) && (state.max == null || p.price <= state.max) &&
      (!state.rating || ratingOf(p).avg >= state.rating) && (!state.deals || p.compareAt) &&
      (!state.inStock || Object.values(p.stock).some(n => n > 0)) &&
      (!nq || nq.split(/\s+/).every(w => normalize(`${p.name} ${(getBrand(p.brand) || {}).name} ${p.desc} ${p.features.join(' ')} ${getSub(p.sub).name}`).includes(w)))
    );
    const s = {
      popular: (a, b) => (b.sales || 0) - (a.sales || 0) || new Date(b.published || b.created) - new Date(a.published || a.created), newest: (a, b) => new Date(b.published || b.created) - new Date(a.published || a.created),
      'price-asc': (a, b) => a.price - b.price, discount: (a, b) => ((b.compareAt || b.price) - b.price) / (b.compareAt || b.price) - ((a.compareAt || a.price) - a.price) / (a.compareAt || a.price), 'price-desc': (a, b) => b.price - a.price, rating: (a, b) => ratingOf(b).avg - ratingOf(a).avg || ratingOf(b).count - ratingOf(a).count,
    }[state.sort];
    return list.sort(s);
  }

  function render() {
    const cat = getCategory(state.cat), sub = state.sub ? getSub(state.sub) : null;
    // Encabezado y migas
    $('#catTitle').textContent = state.q ? `Resultados para “${state.q}”` : sub ? sub.name : cat ? cat.name : state.newOnly ? 'Novedades' : state.deals ? 'Ofertas' : 'Catálogo';
    $('#catDesc').textContent = state.newOnly && !cat && !state.q ? 'Lo más reciente de nuestras marcas emergentes: piezas recién llegadas al marketplace.'
      : state.deals && !cat && !state.q ? 'Precios especiales por tiempo limitado, directo de las marcas. Ordenado por mayor descuento.'
      : cat ? `${cat.desc}. Piezas seleccionadas de marcas emergentes.` : 'Todo el diseño independiente de nuestras marcas emergentes en un solo lugar.';
    $('.page-hero').classList.toggle('hero-deals', state.deals && !state.newOnly);
    $('.page-hero').classList.toggle('hero-new', state.newOnly);
    // Navegación activa del header
    $$('.main-nav a').forEach(a => a.classList.toggle('active', a.textContent === (state.newOnly ? 'Novedades' : state.deals ? 'Ofertas' : 'Catálogo')));
    $('#crumbs').innerHTML = `<a href="index.html">Inicio</a><span>/</span><a href="catalog.html">Catálogo</a>` + (cat ? `<span>/</span><a href="catalog.html?cat=${cat.id}">${cat.name}</a>` : '') + (sub ? `<span>/</span><span>${sub.name}</span>` : '');
    document.title = `${$('#catTitle').textContent} — VibeMarket`;
    // Pills de subcategoría
    $('#catPills').innerHTML = cat
      ? `<button class="pill ${!state.sub ? 'active' : ''}" data-s="">Todo ${cat.name}</button>` + cat.subs.map(s => `<button class="pill ${state.sub === s.id ? 'active' : ''}" data-s="${s.id}">${s.name}</button>`).join('')
      : CATEGORIES.map(c => `<button class="pill" data-c="${c.id}">${c.name}</button>`).join('');
    $$('#catPills .pill').forEach(b => b.onclick = () => { if (b.dataset.c) state.cat = b.dataset.c; else state.sub = b.dataset.s; render(); });
    // Árbol activo
    $$('#catTree a').forEach(a => a.classList.toggle('active', a.dataset.cat === state.cat && a.dataset.sub === state.sub));
    $$('#colorFilters .color-dot').forEach(d => d.classList.toggle('active', state.colors.includes(d.dataset.color)));
    $('#priceLabel').textContent = state.max ? `hasta ${moneyShort(state.max)}` : '';
    // Chips activos
    const chips = [];
    if (state.q) chips.push(['q', `“${state.q}”`]);
    if (cat) chips.push(['cat', cat.name]);
    if (sub) chips.push(['sub', sub.name]);
    state.brands.forEach(b => chips.push([`brand:${b}`, (getBrand(b) || { name: b }).name]));
    state.features.forEach(f => chips.push([`feat:${f}`, f]));
    state.colors.forEach(c => chips.push([`color:${c}`, C[c].name]));
    if (state.min != null || state.max != null) chips.push(['price', `${state.min != null ? moneyShort(state.min) : '$0'} – ${state.max != null ? moneyShort(state.max) : '∞'}`]);
    if (state.rating) chips.push(['rating', `${state.rating}★+`]);
    if (state.newOnly) chips.push(['new', 'Novedades']);
    if (state.deals) chips.push(['deals', 'En oferta']);
    if (state.inStock) chips.push(['stock', 'Con stock']);
    $('#activeFilters').innerHTML = chips.map(([k, l]) => `<span class="chip">${escapeHtml(l)}<button data-rm="${k}" aria-label="Quitar filtro">×</button></span>`).join('');
    // Resultados
    const list = filtered();
    $('#resultCount').textContent = `${list.length} ${list.length === 1 ? 'producto' : 'productos'}`;
    const grid = $('#results');
    grid.classList.toggle('list', state.view === 'list');
    $('#viewGrid').classList.toggle('active', state.view === 'grid'); $('#viewList').classList.toggle('active', state.view === 'list');
    grid.innerHTML = list.length ? list.map(productCard).join('')
      : !ALL.length ? `<div class="empty-state card" style="grid-column:1/-1"><h3>Aún no hay productos publicados</h3><p class="muted">Cuando las marcas suban sus productos y el equipo los apruebe, aparecerán aquí.</p><a class="btn btn-accent" href="login.html?role=vendor">Vende con nosotros</a></div>`
      : `<div class="empty-state" style="grid-column:1/-1"><h3>No encontramos productos</h3><p class="muted">Prueba quitando algunos filtros o buscando otro término.</p><button class="btn btn-outline" onclick="document.getElementById('clearFilters').click()">Limpiar filtros</button></div>`;
    // URL compartible
    const u = new URLSearchParams();
    if (state.cat) u.set('cat', state.cat); if (state.sub) u.set('sub', state.sub); if (state.q) u.set('q', state.q);
    if (!['popular', 'newest', 'discount'].includes(state.sort)) u.set('sort', state.sort); if (state.deals) u.set('ofertas', '1'); if (state.newOnly) u.set('nuevo', '1');
    history.replaceState(null, '', withHash('catalog.html' + (u.toString() ? '?' + u : '')));
  }
  render();
});
