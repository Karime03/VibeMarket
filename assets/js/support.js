/* VibeMarket — Soporte: FAQ con búsqueda, contacto, políticas */
onReady(() => {
  const FAQ = [
    ['Pedidos', '¿Cómo rastreo mi pedido?', 'Entra a Mi cuenta › Seguimiento. También te enviamos la guía por correo y, si lo activaste, actualizaciones por WhatsApp.'],
    ['Pedidos', '¿Puedo modificar o cancelar mi pedido?', 'Sí, mientras esté en estado “Confirmado” (normalmente las primeras 2 horas). Escríbenos por chat con tu número de pedido.'],
    ['Pedidos', '¿Por qué recibí mi pedido en varios paquetes?', 'Cada marca envía desde su taller. Si compraste a varias marcas, llegarán por separado, pero pagas un solo envío.'],
    ['Envíos', '¿Cuánto cuesta el envío?', 'Estándar $99, Express $189, punto Pickit gratis. El envío estándar es gratis desde $999 MXN.'],
    ['Envíos', '¿Hacen envíos internacionales?', 'Por ahora enviamos solo dentro de México. Estamos trabajando para llegar a EE. UU. en 2027.'],
    ['Devoluciones', '¿Cuál es el plazo para devolver?', 'Tienes 30 días naturales desde la entrega. La guía de retorno es gratuita.'],
    ['Devoluciones', '¿Cuándo recibo mi reembolso?', 'Entre 5 y 10 días hábiles después de que la marca recibe e inspecciona el producto, al mismo método de pago.'],
    ['Pagos', '¿Qué métodos de pago aceptan?', 'Tarjetas Visa, Mastercard y Amex (vía Stripe), PayPal, Mercado Pago y efectivo en OXXO.'],
    ['Pagos', '¿Ofrecen meses sin intereses?', 'Sí, 3 y 6 MSI con tarjetas de crédito participantes en compras desde $600.'],
    ['Pagos', '¿Cómo solicito factura?', 'Marca “Requiero factura” en el checkout o solicítala desde Mi cuenta dentro del mes de compra. Emitimos CFDI 4.0.'],
    ['Productos', '¿Cómo sé qué talla elegir?', 'Cada producto de moda incluye una tabla de medidas en Especificaciones. Si tienes duda, el chat te ayuda a elegir.'],
    ['Productos', '¿Los productos son realmente hechos a mano?', 'Verificamos el proceso de cada marca. Los productos con la etiqueta “Hecho a mano” se elaboran artesanalmente.'],
    ['Vender', '¿Cómo puedo vender mi marca en VibeMarket?', 'Escríbenos a marcas@vibemarket.mx. Revisamos tu solicitud en 5 días hábiles. Comisión del 12% por venta, sin mensualidad.'],
  ];
  const cats = ['Todas', ...new Set(FAQ.map(f => f[0]))];
  let cat = 'Todas', q = '';

  $('#faqSearchIco').outerHTML = ICONS.search;
  $('#helpCards').innerHTML = [
    [ICONS.box, 'Mis pedidos', 'Rastreo, cambios y cancelaciones', 'Pedidos'],
    [ICONS.return, 'Devoluciones', 'Inicia una devolución en 2 minutos', 'Devoluciones'],
    [ICONS.truck, 'Envíos', 'Tiempos, costos y cobertura', 'Envíos'],
    [ICONS.shield, 'Pagos y facturas', 'Métodos, MSI y CFDI', 'Pagos'],
  ].map(([i, t, s, c]) => `<button class="help-card" data-cat="${c}"><span class="ico">${i}</span><strong style="display:block">${t}</strong><span class="small muted">${s}</span></button>`).join('');
  $$('#helpCards [data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; render(); $('#faq').scrollIntoView({ behavior: 'smooth' }); });

  // Canales de contacto (todos interactivos)
  const btnLink = (href, text, primary) => `<a class="btn ${primary ? 'btn-primary' : 'btn-ghost'} btn-sm" href="${href}" ${href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${text}</a>`;
  $('#channels').innerHTML = [
    [ICONS.whatsapp.replace('width="16" height="16"', ''), 'WhatsApp', COMPANY.phone, btnLink(CONTACT.whatsapp(), 'Abrir WhatsApp', true)],
    [ICONS.mail, 'Correo (Gmail)', COMPANY.email, btnLink(CONTACT.gmail(), 'Escribir en Gmail') + btnLink(CONTACT.mailto(), 'Otra app')],
    [ICONS.phone, 'Teléfono', `${COMPANY.phone} · ${COMPANY.hours}`, btnLink(CONTACT.tel(), 'Llamar')],
    [ICONS.chat, 'Chat de ayuda', 'Respuestas inmediatas en esta página', '<button class="btn btn-ghost btn-sm" onclick="openChat()">Abrir chat</button>'],
  ].map(([i, t, s, a]) => `<div class="channel"><span class="ico">${i}</span><div style="flex:1;min-width:0"><strong>${t}</strong><div class="small muted" style="overflow-wrap:anywhere">${escapeHtml(s)}</div></div><div style="display:flex;gap:6px;flex-wrap:wrap">${a}</div></div>`).join('');

  // Información de la empresa
  $('#valCommission').textContent = `${100 - DEFAULT_COMMISSION}% de cada venta llega directo a la marca.`;
  $('#companyList').innerHTML = [
    ['Empresa', escapeHtml(COMPANY.legalName)],
    ['Correo', `<a href="${CONTACT.gmail()}" target="_blank" rel="noopener" class="contact-link">${escapeHtml(COMPANY.email)}</a> <span class="muted small">· <a href="${CONTACT.mailto()}" class="link-btn">mailto</a></span>`],
    ['WhatsApp', `<a href="${CONTACT.whatsapp()}" target="_blank" rel="noopener" class="contact-link">${ICONS.whatsapp} ${escapeHtml(COMPANY.phone)}</a>`],
    ['Teléfono', `<a href="${CONTACT.tel()}" class="contact-link">${escapeHtml(COMPANY.phone)}</a>`],
    ['Horario', escapeHtml(COMPANY.hours)],
    ['Cobertura', escapeHtml(COMPANY.location)],
    ...(COMPANY.rfc ? [['RFC', escapeHtml(COMPANY.rfc)]] : []),
  ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

  function render() {
    $('#faqCats').innerHTML = cats.map(c => `<button class="${c === cat ? 'active' : ''}" data-c="${c}">${c}</button>`).join('');
    $$('#faqCats button').forEach(b => b.onclick = () => { cat = b.dataset.c; render(); });
    const n = normalize(q);
    const list = FAQ.filter(f => (cat === 'Todas' || f[0] === cat) && (!n || normalize(f[1] + ' ' + f[2]).includes(n)));
    $('#faqList').innerHTML = list.length ? list.map(([c, qq, a], i) => `<details class="faq-item" ${i === 0 && !n ? 'open' : ''}><summary>${qq}</summary><p>${a}</p></details>`).join('')
      : `<div class="card"><p>No encontramos respuestas para “${escapeHtml(q)}”.</p><button class="btn btn-primary btn-sm" onclick="openChat()">Pregúntale al asistente</button></div>`;
  }
  $('#faqSearch').addEventListener('input', e => { q = e.target.value; cat = 'Todas'; render(); });
  $('#faqSearch').addEventListener('keydown', e => { if (e.key === 'Enter') $('#faq').scrollIntoView({ behavior: 'smooth' }); });

  // Tabs de políticas
  $$('.tabs button').forEach(b => b.onclick = () => {
    $$('.tabs button').forEach(x => x.classList.toggle('active', x === b));
    $$('.tab-panel').forEach(t => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
  });

  // Contacto: el mensaje se guarda en la base de datos (contact_messages) y lo atiende el admin
  const formText = () => `Nombre: ${$('#cName').value}\nCorreo: ${$('#cEmail').value}\nMotivo: ${$('#cTopic').value}${$('#cOrder').value ? '\nPedido: ' + $('#cOrder').value : ''}\n\n${$('#cMsg').value}`;
  const syncGmail = () => { $('#formGmail').href = CONTACT.gmail(`${$('#cTopic').value}${$('#cOrder').value ? ' · ' + $('#cOrder').value : ''}`, formText()); };
  ['cName', 'cEmail', 'cTopic', 'cOrder', 'cMsg'].forEach(id => $('#' + id).addEventListener('input', syncGmail)); syncGmail();
  const me = Auth.user(); if (me) { $('#cName').value = me.name; $('#cEmail').value = me.email; syncGmail(); }
  $('#contactForm').onsubmit = async e => {
    e.preventDefault();
    const fields = ['cName', 'cEmail', 'cMsg']; let ok = true;
    fields.forEach(id => { const el = $('#' + id); const bad = !el.value.trim() || (id === 'cEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) || (id === 'cMsg' && el.value.trim().length < 5); el.classList.toggle('invalid', bad); if (bad) ok = false; });
    const m = $('#contactMsg');
    if (!ok) { m.className = 'msg-inline err'; m.textContent = 'Completa los campos marcados (el mensaje debe tener al menos 5 caracteres).'; return; }
    const btn = e.target.querySelector('button.btn-primary'); btn.disabled = true; btn.textContent = 'Enviando…';
    const msg = Messages.add({ name: $('#cName').value.trim(), email: $('#cEmail').value.trim(), topic: $('#cTopic').value, orderRef: $('#cOrder').value.trim().toUpperCase(), message: $('#cMsg').value.trim() });
    Remote.lastError = null;
    await DB.flush();
    btn.disabled = false; btn.textContent = 'Enviar mensaje';
    if (Remote.lastError) { m.className = 'msg-inline err'; m.textContent = 'No se pudo enviar. Intenta de nuevo o usa el botón de Gmail.'; return; }
    m.className = 'msg-inline ok'; m.textContent = `¡Mensaje enviado! Te responderemos a ${msg.email} en menos de 24 h.`;
    $('#cMsg').value = ''; $('#cOrder').value = ''; syncGmail();
  };

  render();
});
