/* VibeMarket — Inicio de sesión y registro por rol */
onReady(() => {
  const ROLES = {
    buyer: { title: 'Entra como comprador', side: 'Descubre piezas únicas de marcas que apenas comienzan.',
      perms: ['Navegar y comprar en todo el catálogo', 'Guardar favoritos y carritos', 'Rastrear pedidos y solicitar devoluciones', 'Escribir reseñas verificadas y leer las de otros compradores', 'Recibir recomendaciones personalizadas'] },
    vendor: { title: 'Entra como vendedor', side: 'Lleva tu marca emergente a miles de compradores.',
      perms: ['Subir productos con fotos, precio, detalles y especificaciones', 'Controlar stock por color y talla', 'Gestionar los pedidos de tu marca y marcarlos como enviados', 'Ver ventas, comisión (12%) y ganancias netas', 'Responder reseñas de tus clientes'] },
    admin: { title: 'Acceso administrativo', side: 'Mantén el marketplace en orden.',
      perms: ['Ver cuántos compradores y vendedores hay', 'Aprobar o suspender marcas y ajustar comisiones', 'Moderar productos antes de publicarse', 'Supervisar pedidos, devoluciones y reseñas', 'Consultar ventas e ingresos por comisión'] },
  };
  let role = qs('role') in ROLES ? qs('role') : null, mode = 'login';
  const next = qs('next');

  $('#authLogo').innerHTML = `${LOGO_MARK}<span class="logo-word" style="color:#fff">Vibe<span style="color:#A9C2B0">Market</span></span>`;
  $('#authLogo svg').style.cssText = 'width:38px;height:38px';
  $('#roleGrid').innerHTML = roleCards();
  $$('#roleGrid .role-card').forEach(a => {
    const t = a.querySelector('strong'), d = a.querySelector('.small'); const wrap = document.createElement('div');
    wrap.append(t, d); a.insertBefore(wrap, a.querySelector('.role-go'));
    a.onclick = e => { e.preventDefault(); role = a.dataset.role; mode = 'login'; render(); };
  });

  // Si ya hay sesión, ofrecer ir a su pantalla
  const cur = Auth.user();
  if (cur && !role) { $('#stepRole h2').insertAdjacentHTML('beforebegin', `<div class="banner ok">Ya iniciaste sesión como <strong>${escapeHtml(cur.name)}</strong> (${ROLE_LABEL[cur.role]}). <a class="btn btn-primary btn-sm" style="margin-left:auto" href="${ROLE_HOME[cur.role]}">Ir a mi pantalla</a></div>`); }

  function render() {
    $('#stepRole').hidden = !!role; $('#stepForm').hidden = !role;
    const R = role ? ROLES[role] : null;
    $('#sideTitle').textContent = R ? R.side : 'Un marketplace para quienes crean y quienes eligen con intención.';
    $('#sideList').innerHTML = R ? R.perms.map(p => `<li>${p}</li>`).join('') : '<li>Compradores: compra y descubre</li><li>Vendedores: sube y vende tus productos</li><li>Administradores: supervisa la plataforma</li>';
    if (!R) return;
    $('#roleEyebrow').textContent = ROLE_LABEL[role];
    $('#formTitle').textContent = mode === 'login' ? R.title : role === 'vendor' ? 'Registra tu marca' : 'Crea tu cuenta de comprador';
    $('#modeSeg').hidden = role === 'admin';
    if (role === 'admin' && Users.hasAdmin()) mode = 'login';
    $$('#modeSeg button').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
    // Primer uso: si todavía no existe ningún administrador, se crea aquí (configuración inicial)
    const setup = role === 'admin' && !Users.hasAdmin();
    if (setup) mode = 'register';
    $('#demoBox').hidden = !setup && !(mode === 'login' && role !== 'admin');
    $('#demoBox').innerHTML = setup
      ? `<span>${ICONS.shield.replace('<svg', '<svg width="18" height="18" style="vertical-align:-4px"')} <strong>Configuración inicial:</strong> aún no hay administradores. Crea la cuenta principal de VibeMarket.</span>`
      : `<span>¿Aún no tienes cuenta de ${ROLE_LABEL[role].toLowerCase()}? <button type="button" class="link-btn" id="goReg">${role === 'vendor' ? 'Registra tu marca' : 'Crea una aquí'}</button></span>`;
    $('#goReg')?.addEventListener('click', () => { mode = 'register'; render(); });
    if (setup) $('#formTitle').textContent = 'Crea la cuenta de administrador';
    $('#loginForm').hidden = mode !== 'login'; $('#registerForm').hidden = mode !== 'register';
    $$('#modeSeg button').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
    $('#loginErr').textContent = '';
    if (mode === 'register') renderRegister();
    history.replaceState(null, '', withHash(`login.html?role=${role}${next ? '&next=' + encodeURIComponent(next) : ''}`));
  }
  $$('#modeSeg button').forEach(b => b.onclick = () => { mode = b.dataset.m; render(); });
  $('#backRole').onclick = () => { role = null; render(); history.replaceState(null, '', 'login.html'); };
  $('#forgot').onclick = async e => { e.preventDefault(); const em = $('#lEmail').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('Escribe tu correo arriba y vuelve a dar clic'); const r = await Auth.resetPassword(em); toast(r.ok ? 'Te enviamos un enlace para restablecer tu contraseña' : r.msg); };

  // ---------- Login ----------
  $('#loginForm').onsubmit = async e => {
    e.preventDefault();
    const btn = $('#loginForm button.btn-primary'); btn.disabled = true; btn.textContent = 'Entrando…';
    const r = await Auth.login($('#lEmail').value.trim(), $('#lPass').value, role);
    btn.disabled = false; btn.textContent = 'Entrar';
    if (!r.ok) { $('#loginErr').textContent = r.msg; return; }
    Store.set('welcome_seen', true);
    toast(`¡Hola, ${r.user.name.split(' ')[0]}!`);
    setTimeout(() => navigate(next && !next.startsWith('http') ? next : ROLE_HOME[role] === 'account.html' ? 'index.html' : ROLE_HOME[role]), 400);
  };

  // ---------- Registro ----------
  function renderRegister() {
    const f = $('#registerForm');
    const common = `
      <div class="grid-2">
        <div class="field"><label>Nombre completo <span class="req">*</span></label><input class="input" name="name" required autocomplete="name"></div>
        <div class="field"><label>Teléfono / WhatsApp <span class="req">*</span></label><input class="input" name="phone" required inputmode="tel" placeholder="55 1234 5678"></div>
      </div>
      <div class="field"><label>Correo electrónico <span class="req">*</span></label><input class="input" name="email" type="email" required autocomplete="email"></div>
      <div class="grid-2">
        <div class="field"><label>Contraseña <span class="req">*</span></label><input class="input" name="pass" type="password" required minlength="6" autocomplete="new-password"><span class="hint">Mínimo 6 caracteres</span></div>
        <div class="field"><label>Confirmar contraseña <span class="req">*</span></label><input class="input" name="pass2" type="password" required autocomplete="new-password"></div>
      </div>`;
    f.innerHTML = role === 'admin' ? `
      <div class="form-section"><h4>Administrador principal</h4>${common}<p class="hint" style="margin:0">Esta cuenta tendrá control total de la plataforma. Después podrás crear más administradores desde la base de datos.</p></div>
      <p class="err-text" id="regErr"></p>
      <button class="btn btn-primary btn-block">Crear administrador y entrar</button>`
    : role === 'buyer' ? `
      <div class="form-section"><h4>Tus datos</h4>${common}
        <div class="grid-2"><div class="field"><label>Ciudad</label><input class="input" name="city" placeholder="Ciudad de México"></div><div class="field"><label>Fecha de nacimiento</label><input class="input" name="birth" type="date"></div></div>
        <div class="field"><label>¿Qué te interesa?</label><div class="chip-select text">${CATEGORIES.map(c => `<label><input type="checkbox" name="interests" value="${c.id}">${c.name}</label>`).join('')}</div></div>
        <label class="check"><input type="checkbox" name="news" checked> Quiero recibir novedades y 15% en mi primera compra</label>
        <label class="check"><input type="checkbox" name="terms" required> Acepto los <a href="support.html#politicas" class="link-btn" target="_blank">términos</a> y el aviso de privacidad <span class="req">*</span></label>
      </div>
      <p class="err-text" id="regErr"></p>
      <button class="btn btn-primary btn-block">Crear cuenta de comprador</button>`
    : `
      <div class="form-section"><h4>1 · Responsable de la marca</h4>${common}</div>
      <div class="form-section"><h4>2 · Tu marca</h4>
        <div class="grid-2">
          <div class="field"><label>Nombre de la marca <span class="req">*</span></label><input class="input" name="brandName" required></div>
          <div class="field"><label>Categoría principal <span class="req">*</span></label><select class="input" name="mainCat" required><option value="">Selecciona…</option>${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Frase corta (tagline) <span class="req">*</span></label><input class="input" name="tagline" required maxlength="60" placeholder="Ej. Cerámica de alta temperatura"></div>
        <div class="field"><label>Cuéntanos sobre tu marca <span class="req">*</span></label><textarea class="input" name="desc" required placeholder="¿Qué haces, cómo lo produces y qué te hace diferente?"></textarea></div>
        <div class="grid-3">
          <div class="field"><label>Ciudad <span class="req">*</span></label><input class="input" name="city" required></div>
          <div class="field"><label>Año de fundación</label><input class="input" name="since" type="number" min="1990" max="2026" placeholder="2024"></div>
          <div class="field"><label>Instagram</label><input class="input" name="instagram" placeholder="@mimarca"></div>
        </div>
      </div>
      <div class="form-section"><h4>3 · Datos fiscales y de pago</h4>
        <div class="grid-2">
          <div class="field"><label>RFC</label><input class="input" name="rfc" maxlength="13" style="text-transform:uppercase"><span class="hint">Necesario para facturar tus comisiones</span></div>
          <div class="field"><label>CLABE para depósitos</label><input class="input" name="clabe" maxlength="18" inputmode="numeric"><span class="hint">18 dígitos · se puede agregar después</span></div>
        </div>
        <label class="check"><input type="checkbox" name="terms" required> Acepto el Acuerdo de Vendedor y la comisión del 12% por venta <span class="req">*</span></label>
      </div>
      <p class="err-text" id="regErr"></p>
      <button class="btn btn-accent btn-block">Enviar solicitud de marca</button>
      <p class="small muted center" style="margin-top:10px">Un administrador revisará tu marca. Mientras tanto ya puedes subir tus productos.</p>`;
    f.onsubmit = onRegister;
  }

  async function onRegister(e) {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f)); d.interests = new FormData(f).getAll('interests');
    $$('.invalid', f).forEach(i => i.classList.remove('invalid'));
    const bad = $$('[required]', f).filter(i => i.type === 'checkbox' ? !i.checked : !i.value.trim());
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) bad.push(f.email);
    bad.forEach(i => i.classList.add('invalid'));
    const err = $('#regErr');
    if (bad.length) { err.textContent = 'Completa los campos marcados.'; bad[0].focus(); return; }
    if (d.pass.length < 6) { err.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
    if (d.pass !== d.pass2) { err.textContent = 'Las contraseñas no coinciden.'; f.pass2.classList.add('invalid'); return; }
    if (d.rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i.test(d.rfc)) { err.textContent = 'El RFC no tiene un formato válido.'; f.rfc.classList.add('invalid'); return; }
    if (d.clabe && !/^\d{18}$/.test(d.clabe)) { err.textContent = 'La CLABE debe tener 18 dígitos.'; f.clabe.classList.add('invalid'); return; }

    if (role === 'admin' && Users.hasAdmin()) { err.textContent = 'Ya existe un administrador. Inicia sesión.'; return; }
    const palette = ['#B8643F', '#2F4A3A', '#7C8B6A', '#C08B4A', '#8A6E5A', '#5E6E7A', '#4F6D8A'];
    const prefs = { email_news: !!d.news, email_orders: true, wa_orders: true, wa_promos: false, sms: false, price_drop: true, freq: 'biweekly' };
    const brand = role === 'vendor' ? { name: d.brandName.trim(), city: d.city, color: palette[Math.floor(Math.random() * palette.length)], since: +d.since || new Date().getFullYear(),
      tagline: d.tagline, desc: d.desc, mainCat: d.mainCat, instagram: d.instagram, rfc: (d.rfc || '').toUpperCase(), clabe: d.clabe, whatsapp: d.phone } : undefined;
    const btn = f.querySelector('button.btn-primary, button.btn-accent'); const label = btn.textContent; btn.disabled = true; btn.textContent = 'Creando cuenta…';
    const r = await Auth.register({ role, name: d.name.trim(), email: d.email.trim(), pass: d.pass, phone: d.phone, city: d.city || null, birth: d.birth || null,
      interests: d.interests, prefs: role === 'buyer' ? prefs : undefined, brand });
    btn.disabled = false; btn.textContent = label;
    if (!r.ok) { err.textContent = r.msg; return; }
    Store.set('welcome_seen', true);
    if (r.needsConfirm) {
      f.innerHTML = `<div class="banner ok" style="display:block"><strong>¡Cuenta creada!</strong> Te enviamos un correo a <strong>${escapeHtml(d.email)}</strong>. Abre el enlace para confirmarla y después inicia sesión aquí.</div><button type="button" class="btn btn-primary btn-block" id="toLogin">Ir a iniciar sesión</button>`;
      $('#toLogin').onclick = () => { mode = 'login'; render(); };
      return;
    }
    toast(role === 'vendor' ? 'Solicitud enviada. ¡Bienvenida a VibeMarket!' : role === 'admin' ? 'Cuenta de administrador creada' : '¡Cuenta creada! Usa BIENVENIDA15 en tu primera compra');
    setTimeout(() => navigate(next || (role === 'buyer' ? 'index.html' : ROLE_HOME[role])), 700);
  }

  render();
});
