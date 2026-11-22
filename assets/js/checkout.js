/* VibeMarket — Checkout de una sola página (invitado o registrado) */
onReady(() => {
  if (!Cart.items().length) {
    $('#coForm').outerHTML = `<div class="empty-state"><h2>No hay productos para pagar</h2><p class="muted">Agrega algo a tu carrito para continuar.</p><a href="catalog.html" class="btn btn-primary">Ir al catálogo</a></div>`;
    return;
  }
  let shipping = Store.get('shipping', null);
  const cu = Auth.user();
  if (cu && cu.role !== 'buyer') {
    $('#coForm').outerHTML = `<div class="empty-state"><h2>Estás como ${ROLE_LABEL[cu.role]}</h2><p class="muted">Para comprar necesitas una cuenta de comprador o comprar como invitado.</p><button class="btn btn-primary" onclick="Auth.logout();location.reload()">Cerrar sesión y continuar</button></div>`;
    return;
  }

  // ---------- Contacto: invitado / login ----------
  const applyUser = () => {
    const u = Auth.user();
    $('#modeSeg').hidden = !!u; $('#guestBox').hidden = false; $('#loginBox').hidden = true; $('#loggedBox').hidden = !u;
    // Con sesión: el correo viene de la cuenta; el teléfono sigue visible por si falta o quiere cambiarlo
    $('#email').closest('.field').hidden = !!u;
    $('#guestBox [name=createAccount]').closest('label').hidden = !!u;
    if (u) {
      $('#loggedBox').innerHTML = `Comprando como <strong>${escapeHtml(u.name)}</strong> (${escapeHtml(u.email)}) · <button type="button" class="link-btn" id="coLogout">Cambiar</button>`;
      $('#email').value = u.email;
      const prof = Auth.profile(); if (prof && prof.phone) $('#phone').value = prof.phone;
      const addr = Store.get('addresses_' + u.id, [])[0];
      if (addr) Object.entries({ fname: addr.fname, lname: addr.lname, street: addr.street, cp: addr.cp, colonia: addr.colonia, city: addr.city, state: addr.state }).forEach(([k, v]) => { if ($('#' + k) && v) $('#' + k).value = v; });
      if ($('#cp').value.length === 5) { quote($('#cp').value); window.__postal?.refresh(); }
      $('#coLogout').onclick = () => { Auth.logout(); applyUser(); };
    }
  };
  $$('#modeSeg button').forEach(b => b.onclick = () => {
    $$('#modeSeg button').forEach(x => x.classList.toggle('active', x === b));
    $('#guestBox').hidden = b.dataset.mode !== 'guest'; $('#loginBox').hidden = b.dataset.mode !== 'login';
  });
  $('#loginBtn').onclick = () => { navigate('login.html?role=buyer&next=checkout.html'); };
  $('#loginBox').innerHTML = '<p class="small muted">Inicia sesión con tu cuenta de comprador para usar tus direcciones guardadas y ver este pedido en tu historial.</p><button type="button" class="btn btn-outline btn-sm" id="loginBtn2">Iniciar sesión como comprador</button>';
  $('#loginBtn2').onclick = () => { navigate('login.html?role=buyer&next=checkout.html'); };

  // ---------- Estados de la República ----------
  $('#state').innerHTML = stateOptions();
  let stateTouched = false;
  $('#state').addEventListener('change', () => { stateTouched = true; });

  // ---------- Envío ----------
  async function quote(cp) {
    $('#coShip').innerHTML = '<p class="small muted">Cotizando con paqueterías…</p>';
    try {
      const q = await Shipping.quote(cp, Cart.subtotal());
      const o = q.options.find(x => x.id === shipping?.optionId) || q.options[0];
      shipping = { cp, quote: q, optionId: o.id, cost: o.cost }; Store.set('shipping', shipping);
      $('#coShip').innerHTML = q.options.map(o => `<label class="ship-opt"><input type="radio" name="shipOpt" value="${o.id}" ${o.id === shipping.optionId ? 'checked' : ''}><div><strong>${o.name}</strong><div class="small muted">${o.carrier} · Llega ${o.eta}</div></div><span class="price">${o.cost ? moneyShort(o.cost) : 'Gratis'}</span></label>`).join('');
      $$('#coShip input').forEach(r => r.onchange = () => { const opt = q.options.find(x => x.id === r.value); shipping = { ...shipping, optionId: opt.id, cost: opt.cost }; Store.set('shipping', shipping); renderSummary(); });
    } catch (err) { $('#coShip').innerHTML = `<p class="msg-inline err">${err.message}</p>`; shipping = null; }
    renderSummary();
  }
  // Al escribir el C.P. se rellenan colonia, ciudad y estado (catálogo SEPOMEX)
  const postal = window.__postal = PostalCodes.attach({ cp: '#cp', colonia: '#colonia', city: '#city', state: '#state' });
  $('#cp').addEventListener('input', e => {
    if (e.target.value.length === 5) quote(e.target.value);
  });
  if (shipping?.cp && !$('#cp').value) { $('#cp').value = shipping.cp; quote(shipping.cp); }
  if (/^\d{5}$/.test($('#cp').value)) postal.refresh();

  // ---------- Resumen ----------
  $('#coItems').innerHTML = Cart.items().map(it => { const p = getProduct(it.id); return `<div class="co-item"><div class="thumb"><img src="${productImage(p, it.color)}" alt=""><span class="q">${it.qty}</span></div><div><div style="font-weight:500">${p.name}</div><div class="small muted">${C[it.color].name} · ${it.size}</div></div><span class="price">${moneyShort(p.price * it.qty)}</span></div>`; }).join('');
  $('#coCoupon').innerHTML = `<input class="input" id="ccode" placeholder="Código de descuento" aria-label="Código de descuento"><button type="button" class="btn btn-ghost btn-sm" id="ccodeBtn">Aplicar</button>`;
  $('#ccodeBtn').onclick = () => { const r = Pricing.applyCoupon($('#ccode').value, Cart.subtotal()); toast(r.msg); renderSummary(); };
  function renderSummary() {
    const t = Pricing.totals(shipping ? shipping.cost : null);
    $('#cSub').textContent = money(t.subtotal);
    $('#cDiscRow').hidden = !t.code; $('#cCode').textContent = t.code || '';
    $('#cDisc').textContent = t.discount ? '−' + money(t.discount) : 'Envío gratis';
    $('#cShip').textContent = t.ship == null ? 'Ingresa tu C.P.' : t.ship === 0 ? 'Gratis' : money(t.ship);
    $('#cTotal').textContent = money(t.total); $('#cIva').textContent = money(t.iva);
    const pay = $('input[name=pay]:checked').value;
    $('#placeOrder').textContent = pay === 'oxxo' ? `Generar referencia OXXO · ${moneyShort(t.total)}` : pay === 'paypal' ? 'Continuar con PayPal' : pay === 'mercadopago' ? 'Continuar con Mercado Pago' : `Pagar ${moneyShort(t.total)}`;
  }
  $$('input[name=pay]').forEach(r => r.onchange = renderSummary);
  $('#billing').onchange = e => $('#billingBox').hidden = !e.target.checked;

  // Formato de tarjeta
  $('#ccNum').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim());
  $('#ccExp').addEventListener('input', e => { let v = e.target.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); e.target.value = v; });

  // =========================================================
  //  PAGO SIMULADO (proyecto académico: no se procesan cargos reales)
  // =========================================================
  const TEST_CARDS = {
    '4000000000000002': 'La tarjeta fue rechazada por el banco emisor.',
    '4000000000009995': 'Fondos insuficientes.',
    '4000000000000069': 'La tarjeta está vencida según el banco.',
    '4000000000000127': 'El código de seguridad (CVC) es incorrecto.',
  };
  const cardBrand = n => /^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'American Express' : '';
  const luhn = n => { let sum = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; } return sum % 10 === 0; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Marca de la tarjeta mientras se escribe
  $('#ccNum').insertAdjacentHTML('afterend', '<span class="hint" id="ccBrand"></span>');
  $('#ccNum').addEventListener('input', () => { const n = $('#ccNum').value.replace(/\D/g, ''); const b = cardBrand(n); $('#ccBrand').textContent = b ? b + (n.length >= 15 ? (luhn(n) ? ' · número válido' : ' · número inválido') : '') : ''; });
  $('#ccCvc').addEventListener('input', e => e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4));

  /** Valida la tarjeta como lo haría una pasarela. Devuelve {ok, field, msg, last4, brand} */
  function validateCard() {
    const n = $('#ccNum').value.replace(/\D/g, ''), exp = $('#ccExp').value, cvc = $('#ccCvc').value, name = $('#ccName').value.trim();
    const brand = cardBrand(n);
    if (name.length < 3) return { ok: false, field: 'ccName', msg: 'Escribe el nombre como aparece en la tarjeta.' };
    if (!brand) return { ok: false, field: 'ccNum', msg: 'Solo aceptamos Visa, Mastercard o American Express.' };
    if (n.length !== (brand === 'American Express' ? 15 : 16) || !luhn(n)) return { ok: false, field: 'ccNum', msg: 'El número de tarjeta no es válido.' };
    const m = exp.match(/^(\d{2})\/(\d{2})$/); const mm = m ? +m[1] : 0, yy = m ? 2000 + +m[2] : 0;
    const now = new Date(); if (!m || mm < 1 || mm > 12 || yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) return { ok: false, field: 'ccExp', msg: 'La fecha de vencimiento no es válida o ya pasó.' };
    if (cvc.length !== (brand === 'American Express' ? 4 : 3)) return { ok: false, field: 'ccCvc', msg: `El CVC debe tener ${brand === 'American Express' ? 4 : 3} dígitos.` };
    return { ok: true, n, last4: n.slice(-4), brand };
  }

  // Pantalla de procesamiento y ventana simulada de PayPal / Mercado Pago
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" id="payModal" role="dialog" aria-modal="true" aria-live="polite"><div class="modal" id="payBody"></div></div>`);
  const payModal = html => { $('#payBody').innerHTML = html; $('#payModal').classList.add('open'); };
  const closePay = () => $('#payModal').classList.remove('open');
  async function processingSteps(steps) {
    payModal(`<div class="check-ico" style="background:var(--sand);color:var(--ink-2)"><span class="spinner"></span></div><h3 id="payStep">${steps[0]}</h3><p class="small muted">Modo simulación · no se realiza ningún cargo real</p>`);
    for (const st of steps) { $('#payStep').textContent = st; await sleep(650); }
  }
  function walletWindow(method, total) {
    const name = method === 'paypal' ? 'PayPal' : 'Mercado Pago';
    return new Promise(resolve => {
      payModal(`<span class="sim-badge">Simulación</span><h3 style="margin-top:14px">${name}</h3><p class="muted small">Así se vería la ventana de ${name}. Confirma para aprobar el pago de <strong>${money(total)}</strong>.</p>
        <div class="field" style="text-align:left"><label>Cuenta de ${name}</label><input class="input" id="walletEmail" type="email" value="${escapeHtml($('#email').value)}"></div>
        <div style="display:grid;gap:8px"><button type="button" class="btn btn-primary" id="walletOk">Pagar ${money(total)}</button><button type="button" class="btn btn-ghost" id="walletNo">Cancelar y volver</button></div>`);
      $('#walletOk').onclick = () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#walletEmail').value)) return $('#walletEmail').classList.add('invalid'); resolve({ ok: true, account: $('#walletEmail').value }); };
      $('#walletNo').onclick = () => { closePay(); resolve({ ok: false }); };
    });
  }

  /** Simula la autorización del pago. Devuelve el objeto payment o lanza un error legible. */
  async function simulatePayment(method, total) {
    if (method === 'card') {
      const v = validateCard();
      if (!v.ok) { $('#' + v.field).classList.add('invalid'); $('#' + v.field).focus(); throw new Error(v.msg); }
      await processingSteps(['Validando los datos de la tarjeta…', 'Contactando al banco emisor…', 'Verificando con 3D Secure…', 'Autorizando el pago…']);
      if (TEST_CARDS[v.n]) { closePay(); throw new Error('Pago rechazado: ' + TEST_CARDS[v.n]); }
      const msi = $('#msi').value;
      return { method: 'card', status: 'approved', label: `${v.brand} •••• ${v.last4}${/MSI/.test(msi) ? ' · ' + msi : ''}`, last4: v.last4, card_brand: v.brand, installments: msi };
    }
    if (method === 'paypal' || method === 'mercadopago') {
      const r = await walletWindow(method, total);
      if (!r.ok) throw new Error('Cancelaste el pago. Puedes elegir otro método.');
      await processingSteps(['Confirmando con ' + (method === 'paypal' ? 'PayPal' : 'Mercado Pago') + '…', 'Autorizando el pago…']);
      return { method, status: 'approved', label: `${method === 'paypal' ? 'PayPal' : 'Mercado Pago'} · ${r.account}` };
    }
    await processingSteps(['Generando tu referencia de pago OXXO…']);
    return { method: 'oxxo', status: 'pending', label: 'Efectivo en OXXO' };
  }

  // ---------- Enviar pedido ----------
  $('#coForm').addEventListener('submit', async e => {
    e.preventDefault();
    $$('.input.invalid').forEach(i => i.classList.remove('invalid'));
    const req = ['email', 'phone', 'fname', 'lname', 'street', 'cp', 'colonia', 'city', 'state'];
    const bad = req.filter(id => { let el = $('#' + id); if (el.closest('.field')?.hidden) return false; if (el.hidden && el.previousElementSibling?.tagName === 'SELECT') el = el.previousElementSibling; const v = el.value.trim();
      if (!v) return true;
      if (id === 'email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (id === 'phone') return v.replace(/\D/g, '').length < 10;
      if (id === 'cp') return !/^\d{5}$/.test(v);
      return false; });
    const fieldOf = id => { const el = $('#' + id); return el.hidden && el.previousElementSibling?.tagName === 'SELECT' ? el.previousElementSibling : el; };
    bad.forEach(id => fieldOf(id).classList.add('invalid'));
    if (bad.length) { $('#coError').textContent = 'Revisa los campos marcados en rojo.'; fieldOf(bad[0]).focus(); return; }
    if (!shipping) { $('#coError').textContent = 'Selecciona un método de envío.'; return; }
    if (!$('#terms').checked) { $('#coError').textContent = 'Debes aceptar los términos para continuar.'; return; }
    $('#coError').textContent = '';
    const method = $('input[name=pay]:checked').value;
    const t = Pricing.totals(shipping.cost);
    const btn = $('#placeOrder'); const label = btn.textContent; btn.disabled = true; btn.textContent = 'Procesando…';
    let done = false;
    try {
      // 1) Autorización simulada del pago
      const payment = await simulatePayment(method, t.total);
      // 2) Registro del pedido en la base de datos (el servidor valida precios y stock)
      $('#payStep') && ($('#payStep').textContent = 'Registrando tu pedido…');
      const opt = shipping.quote.options.find(o => o.id === shipping.optionId);
      const order = await Orders.place({
        email: $('#email').value.trim(), phone: $('#phone').value.trim(),
        items: Cart.items().map(i => ({ id: i.id, color: i.color, size: i.size, qty: i.qty })),
        coupon: Pricing.coupon(), shippingCost: shipping.cost, shipping: { method: opt.name, carrier: opt.carrier, eta: opt.eta },
        address: { name: `${$('#fname').value.trim()} ${$('#lname').value.trim()}`, fname: $('#fname').value.trim(), lname: $('#lname').value.trim(), street: $('#street').value.trim(),
          colonia: $('#colonia').value.trim(), cp: $('#cp').value.trim(), city: $('#city').value.trim(), state: $('#state').value, ref: $('#ref').value.trim() },
        payment,
      });
      await DB.flush();
      closePay();
      Cart.clear(); Pricing.removeCoupon(); Store.del('shipping'); updateBadges();
      // 3) Confirmación
      const p = order.payment || {};
      $('#okIco').innerHTML = ICONS.check.replace('<svg', '<svg width="34" height="34"');
      $('#okTitle').textContent = order.status === 'pending_payment' ? '¡Pedido reservado!' : '¡Pago aprobado!';
      $('#okText').innerHTML = `
        <div class="card" style="text-align:left;margin:6px 0 14px;padding:16px">
          <div class="sum-row"><span>Pedido</span><strong>${order.id}</strong></div>
          <div class="sum-row"><span>Total</span><strong>${money(order.totals.total)}</strong></div>
          <div class="sum-row"><span>Pago</span><span>${escapeHtml(p.label || method)}</span></div>
          ${p.auth_code ? `<div class="sum-row"><span>Autorización</span><span>${p.auth_code}</span></div>` : ''}
          ${order.payRef ? `<div class="sum-row"><span>Referencia OXXO</span><strong>${order.payRef}</strong></div><div class="small muted">Válida 72 h. Preparamos tu pedido al confirmarse el pago.</div>` : ''}
        </div>
        <span class="sim-badge">Pago simulado · sin cargos reales</span>
        <p class="small muted" style="margin-top:10px">Enviamos el detalle a <strong>${escapeHtml(order.email)}</strong>.${Auth.user() ? ' Puedes seguirlo en Mi cuenta › Seguimiento.' : ''}</p>`;
      if (!Auth.user()) $('#successModal .btn-primary').outerHTML = '<a href="login.html?role=buyer" class="btn btn-primary">Crear cuenta para seguir mis pedidos</a>';
      $('#successModal').classList.add('open');
      done = true; btn.textContent = 'Pedido registrado ✓';
    } catch (err) {
      closePay();
      $('#coError').textContent = err.message || 'No se pudo completar el pago.';
      $('#coError').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally { if (!done) { btn.disabled = false; btn.textContent = label; renderSummary(); } }
  });

  applyUser(); renderSummary();
});
