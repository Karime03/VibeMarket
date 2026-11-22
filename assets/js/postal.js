/* =========================================================
   VibeMarket — Autocompletar dirección por código postal
   ---------------------------------------------------------
   Consulta el catálogo de Correos de México (SEPOMEX) a través
   de la API pública y gratuita "Sepomex" (Icalia Labs, MIT):
   https://github.com/IcaliaLabs/sepomex
   La consulta la hace el navegador del comprador; la página no
   copia ni redistribuye el catálogo.

   Si la API no responde, el estado se deduce del C.P. (config.js)
   y el comprador escribe el resto: la compra nunca se bloquea.
   ========================================================= */
const POSTAL_API = 'https://sepomex.kurenn.dev/api/v1/zip_codes';

const PostalCodes = {
  _cache: {},

  /** Nombre de estado de SEPOMEX → nombre usado en la lista del formulario */
  normalizeState(name) {
    const n = String(name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    if (!n) return '';
    if (n === 'mexico' || n === 'estado de mexico') return 'Estado de México';
    if (n.includes('distrito federal') || n.includes('ciudad de mexico')) return 'Ciudad de México';
    const plain = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return MX_STATES.find(s => plain(s) === n) || MX_STATES.find(s => n.startsWith(plain(s))) || '';
  },

  /**
   * Busca un C.P. Devuelve:
   *  { ok:true, cp, state, municipality, city, colonias:[{name,type}] }
   *  { ok:false, reason:'invalid'|'not_found'|'offline', state }  (state deducido del C.P. si se puede)
   */
  async lookup(cp) {
    cp = String(cp || '').trim();
    if (!/^\d{5}$/.test(cp)) return { ok: false, reason: 'invalid', state: '' };
    if (this._cache[cp]) return this._cache[cp];
    const fallbackState = typeof stateFromCP === 'function' ? stateFromCP(cp) : '';
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(`${POSTAL_API}?zip_code=${cp}&per_page=200`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const rows = (data.zip_codes || []).filter(r => String(r.d_codigo).padStart(5, '0') === cp);
      if (!rows.length) return (this._cache[cp] = { ok: false, reason: 'not_found', state: fallbackState });
      const first = rows[0];
      const seen = new Set();
      const colonias = rows
        .map(r => ({ name: String(r.d_asenta || '').trim(), type: r.d_tipo_asenta || '' }))
        .filter(c => c.name && !seen.has(c.name.toLowerCase()) && seen.add(c.name.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
      const result = {
        ok: true, cp,
        state: this.normalizeState(first.d_estado) || fallbackState,
        municipality: first.d_mnpio || '',
        city: (first.d_ciudad && String(first.d_ciudad).trim()) || first.d_mnpio || '',
        colonias,
      };
      return (this._cache[cp] = result);
    } catch (e) {
      console.warn('[VibeMarket] No se pudo consultar el catálogo de C.P.', e);
      return { ok: false, reason: 'offline', state: fallbackState };
    }
  },

  /**
   * Conecta un formulario de dirección. Los campos se pasan como selectores CSS:
   *  { cp, colonia, city, state, status? , onResult? }
   * - Al completar 5 dígitos rellena estado, ciudad/municipio y colonia.
   * - Si hay varias colonias muestra una lista para elegir (con opción "Otra").
   */
  attach(opts) {
    const $f = sel => document.querySelector(sel);
    const cpEl = $f(opts.cp), colEl = $f(opts.colonia), cityEl = $f(opts.city), stEl = $f(opts.state);
    if (!cpEl || !colEl) return;
    // Mensaje de estado bajo el C.P.
    let status = opts.status ? $f(opts.status) : null;
    if (!status) { status = document.createElement('span'); status.className = 'hint cp-status'; cpEl.insertAdjacentElement('afterend', status); }
    // Lista de colonias (se muestra solo cuando hay varias)
    const sel = document.createElement('select');
    sel.className = colEl.className; sel.hidden = true; sel.setAttribute('aria-label', 'Colonia');
    colEl.insertAdjacentElement('beforebegin', sel);
    const wasRequired = colEl.required;
    const showSelect = on => { sel.hidden = !on; colEl.hidden = on; sel.required = on && wasRequired; colEl.required = !on && wasRequired; };
    sel.addEventListener('change', () => {
      if (sel.value === '__other') { showSelect(false); colEl.value = ''; colEl.focus(); return; }
      colEl.value = sel.value; colEl.classList.remove('invalid'); sel.classList.remove('invalid');
      colEl.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const auto = new Map(); // valores que puso el autocompletado (para limpiarlos si cambia el C.P.)
    const setVal = (el, v) => { if (el && v) { el.value = v; auto.set(el, v); el.classList.remove('invalid'); el.dispatchEvent(new Event('change', { bubbles: true })); } };
    const clearAuto = () => auto.forEach((v, el) => { if (el !== stEl && el.value === v) el.value = ''; });

    let lastCp = '';
    const run = async () => {
      const cp = cpEl.value.replace(/\D/g, '').slice(0, 5);
      if (cpEl.value !== cp) cpEl.value = cp;
      if (cp.length < 5) { if (lastCp) { status.textContent = ''; status.className = 'hint cp-status'; } lastCp = ''; return; }
      if (cp === lastCp) return; lastCp = cp;
      status.className = 'hint cp-status'; status.textContent = 'Buscando el código postal…';
      const r = await this.lookup(cp);
      if (cp !== cpEl.value) return; // el usuario ya cambió el C.P.
      if (r.ok) {
        setVal(stEl, r.state);
        setVal(cityEl, r.city);
        if (r.colonias.length === 1) { showSelect(false); setVal(colEl, r.colonias[0].name); }
        else {
          sel.innerHTML = `<option value="">Elige tu colonia (${r.colonias.length})…</option>` +
            r.colonias.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}${c.type && c.type !== 'Colonia' ? ' · ' + escapeHtml(c.type) : ''}</option>`).join('') +
            '<option value="__other">Otra colonia (escribirla)…</option>';
          const keep = r.colonias.find(c => c.name === colEl.value);
          sel.value = keep ? keep.name : ''; if (!keep) colEl.value = '';
          showSelect(true);
        }
        status.className = 'hint cp-status ok';
        status.textContent = `✓ ${r.city}${r.municipality && r.municipality !== r.city ? ' (' + r.municipality + ')' : ''}, ${r.state}`;
      } else {
        showSelect(false); clearAuto();
        if (r.state) setVal(stEl, r.state);
        status.className = 'hint cp-status warn';
        status.textContent = r.reason === 'not_found'
          ? 'No encontramos ese código postal en el catálogo de Correos de México. Revisa el número o escribe los datos.'
          : 'No pudimos consultar el catálogo en este momento. Escribe colonia y ciudad manualmente.';
      }
      if (opts.onResult) opts.onResult(r);
    };
    cpEl.addEventListener('input', run);
    cpEl.addEventListener('change', run);
    // Si el C.P. ya venía lleno (dirección guardada), conservar la colonia escrita
    if (/^\d{5}$/.test(cpEl.value)) { const saved = colEl.value; run().then(() => { if (saved && sel.hidden === false && [...sel.options].some(o => o.value === saved)) { sel.value = saved; colEl.value = saved; } }); }
    return { refresh: () => { lastCp = ''; return run(); } };
  },
};
