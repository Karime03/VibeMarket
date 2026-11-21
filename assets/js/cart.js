/* VibeMarket — Carrito: cantidades, envío en tiempo real, cupones, carritos guardados */
onReady(() => {
  let shipping = Store.get('shipping', null); // { cp, optionId, cost, quote }

  function render() {
    const items = Cart.items();
    $('#cartCount').textContent = `(${Cart.count()} ${Cart.count() === 1 ? 'artículo' : 'artículos'})`;
    if (!items.length) {
      $('#cartTable').hidden = true; $('#freeShip').innerHTML = '';
      $('#cartBody').innerHTML = '';
      $('#cartTable').insertAdjacentHTML('beforebegin', $('#emptyCart') ? '' : `<div class="empty-state card" id="emptyCart"><h3>Tu carrito está vacío</h3><p class="muted">Descubre piezas únicas de marcas emergentes.</p><a href="catalog.html" class="btn btn-primary">Explorar catálogo</a></div>`);
      $('#toCheckout').classList.add('btn-ghost'); $('#toCheckout').style.pointerEvents = 'none'; $('#toCheckout').style.opacity = .4;
    } else {
      $('#emptyCart')?.remove(); $('#cartTable').hidden = false;
      $('#toCheckout').style.pointerEvents = ''; $('#toCheckout').style.opacity = '';
      $('#cartBody').innerHTML = items.map((it, i) => {
        const p = getProduct(it.id), stock = p.stock[`${it.color}|${it.size}`];
        return `<tr>
          <td><div class="cart-prod"><a href="product.html?id=${p.id}"><img src="${productImage(p, it.color)}" alt=""></a><div>
            <div class="p-brand">${getBrand(p.brand).name}</div><h4><a href="product.html?id=${p.id}">${p.name}</a></h4>
            <div class="small muted">${C[it.color].name} · ${it.size} · ${moneyShort(p.price)} c/u</div>
            <div class="small" style="color:${stock <= 5 ? 'var(--terra)' : 'var(--ok)'};margin-top:4px">${stock <= 5 ? `Solo quedan ${stock}` : 'En stock'}</div>
            <div style="display:flex;gap:14px;margin-top:8px"><button class="link-btn" data-later="${i}">Mover a favoritos</button><button class="link-btn" data-rm="${i}">Eliminar</button></div>
          </div></div></td>
          <td><div class="qty"><button data-q="${i}" data-d="-1" aria-label="Menos">−</button><input data-qi="${i}" type="number" value="${it.qty}" min="1" max="${stock}" aria-label="Cantidad"><button data-q="${i}" data-d="1" aria-label="Más">+</button></div></td>
          <td style="text-align:right" class="price">${moneyShort(p.price * it.qty)}</td>
        </tr>`;
      }).join('');
      const sub = Cart.subtotal(), left = Math.max(0, FREE_SHIPPING_MIN - sub);
      $('#freeShip').innerHTML = `<div class="small">${left ? `Agrega <strong>${moneyShort(left)}</strong> más para obtener <strong>envío estándar gratis</strong>` : '🌿 ¡Felicidades! Tu pedido tiene <strong>envío estándar gratis</strong>'}</div><div class="free-ship-bar"><span style="width:${Math.min(100, sub / FREE_SHIPPING_MIN * 100)}%"></span></div>`;
    }
    renderSummary();
    renderSaved();
  }

  function renderSummary() {
    const t = Pricing.totals(shipping ? shipping.cost : null);
    $('#sSub').textContent = money(t.subtotal);
    $('#sDiscRow').hidden = !t.discount && !(t.code && COUPONS[t.code].type === 'shipping');
    $('#sCode').textContent = t.code || '';
    $('#sDisc').textContent = t.discount ? '−' + money(t.discount) : 'Envío gratis';
    $('#sShip').textContent = t.ship == null ? 'Calcular abajo' : t.ship === 0 ? 'Gratis' : money(t.ship);
    $('#sShip').className = t.ship == null ? 'muted' : '';
    $('#sTotal').textContent = money(t.total);
    $('#sIva').textContent = money(t.iva);
  }

  // Cantidades / eliminar
  $('#cartBody').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]'), later = e.target.closest('[data-later]');
    if (q) { const i = +q.dataset.q; Cart.setQty(i, Cart.items()[i].qty + +q.dataset.d); }
    if (rm) { Cart.remove(+rm.dataset.rm); toast('Producto eliminado'); }
    if (later) { const it = Cart.items()[+later.dataset.later]; if (!Wishlist.has(it.id)) Wishlist.toggle(it.id); Cart.remove(+later.dataset.later); }
    if (q || rm || later) { requote(); render(); }
  });
  $('#cartBody').addEventListener('change', e => { const inp = e.target.closest('[data-qi]'); if (inp) { Cart.setQty(+inp.dataset.qi, +inp.value || 1); requote(); render(); } });
  $('#clearCart').onclick = () => { if (Cart.items().length) { Cart.clear(); render(); toast('Carrito vaciado'); } };

  // Envío en tiempo real
  const showQuote = q => {
    $('#shipResult').innerHTML = `<p class="small muted" style="margin:10px 0 0">Zona: ${q.quote.zone}</p><div class="ship-options">${q.quote.options.map(o => `
      <label class="ship-opt"><input type="radio" name="ship" value="${o.id}" ${o.id === q.optionId ? 'checked' : ''}><div><strong>${o.name}</strong><div class="small muted">${o.carrier} · ${o.eta}</div></div><span class="price">${o.cost ? moneyShort(o.cost) : 'Gratis'}</span></label>`).join('')}</div>`;
    $$('#shipResult input').forEach(r => r.onchange = () => { const o = q.quote.options.find(x => x.id === r.value); shipping = { ...q, optionId: o.id, cost: o.cost }; Store.set('shipping', shipping); renderSummary(); });
  };
  async function quote(cp) {
    $('#shipResult').innerHTML = '<p class="small muted" style="margin:10px 0 0">Consultando paqueterías…</p>';
    try {
      const qr = await Shipping.quote(cp, Cart.subtotal());
      const prev = shipping && shipping.optionId;
      const o = qr.options.find(x => x.id === prev) || qr.options[0];
      shipping = { cp, quote: qr, optionId: o.id, cost: o.cost }; Store.set('shipping', shipping);
      showQuote(shipping); renderSummary();
    } catch (err) { $('#shipResult').innerHTML = `<p class="msg-inline err">${err.message}</p>`; }
  }
  function requote() { if (shipping?.cp) quote(shipping.cp); }
  $('#shipForm').onsubmit = e => { e.preventDefault(); quote($('#cpInput').value.trim()); };
  if (shipping?.cp) { $('#cpInput').value = shipping.cp; showQuote(shipping); }

  // Cupones
  $('#couponForm').onsubmit = e => {
    e.preventDefault(); const r = Pricing.applyCoupon($('#couponInput').value, Cart.subtotal());
    $('#couponMsg').textContent = r.msg; $('#couponMsg').className = 'msg-inline small ' + (r.ok ? 'ok' : 'err');
    if (r.ok) $('#couponInput').value = ''; renderSummary();
  };
  $('#rmCoupon').onclick = () => { Pricing.removeCoupon(); renderSummary(); };

  // Carritos guardados (usuarios registrados)
  function renderSaved() {
    const user = Auth.user(), skey = 'saved_carts_' + (user ? user.id : 'guest'), saved = user && user.role === 'buyer' ? Store.get(skey, []) : [];
    $('#savedHint').innerHTML = user ? 'Tus carritos se sincronizan con tu cuenta.' : 'Disponible para usuarios registrados. <a href="login.html?role=buyer&next=cart.html" class="link-btn" style="color:var(--forest)">Inicia sesión como comprador</a>';
    $('#savedCarts').innerHTML = saved.length ? saved.map((s, i) => `<div class="saved-cart"><div><strong>${escapeHtml(s.name)}</strong><div class="small muted">${s.items.reduce((a, x) => a + x.qty, 0)} artículos · ${new Date(s.date).toLocaleDateString('es-MX')}</div></div><div style="display:flex;gap:6px">${s.items.slice(0, 4).map(x => `<img src="${productImage(getProduct(x.id), x.color)}" style="width:40px;height:50px;border-radius:6px;object-fit:cover" alt="">`).join('')}</div><div style="display:flex;gap:8px"><button class="btn btn-primary btn-sm" data-restore="${i}">Restaurar</button><button class="btn btn-ghost btn-sm" data-del="${i}">Eliminar</button></div></div>`).join('') : '<p class="small muted">Aún no tienes carritos guardados.</p>';
    $$('[data-restore]').forEach(b => b.onclick = () => { Cart.save(saved[+b.dataset.restore].items); toast('Carrito restaurado'); requote(); render(); });
    $$('[data-del]').forEach(b => b.onclick = () => { saved.splice(+b.dataset.del, 1); Store.set(skey, saved); render(); });
  }
  $('#saveCart').onclick = () => {
    const user = Auth.user();
    if (!user || user.role !== 'buyer') { toast('Inicia sesión como comprador para guardar tu carrito'); setTimeout(() => navigate('login.html?role=buyer&next=cart.html'), 900); return; }
    if (!Cart.items().length) return toast('Tu carrito está vacío');
    const skey = 'saved_carts_' + user.id, saved = Store.get(skey, []);
    const name = `Carrito del ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}`;
    saved.unshift({ name, date: new Date().toISOString(), items: Cart.items() }); Store.set(skey, saved);
    toast('Carrito guardado en tu cuenta'); render();
  };

  render();
});
