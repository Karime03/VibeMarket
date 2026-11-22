/* =========================================================
   VibeMarket — CAPA DE DATOS (data access layer)
   ---------------------------------------------------------
   ÚNICO archivo que lee y escribe datos. Dos modos:

   • MODO SUPABASE (producción): si assets/js/env.js define
     SUPABASE_URL y SUPABASE_ANON_KEY. Al abrir cada página se
     cargan los datos que el usuario puede ver (RLS) a una caché
     en memoria; cada cambio se guarda en Supabase de inmediato
     (insert/update/delete por fila). Auth, pedidos (place_order),
     votos y fotos usan Supabase Auth, RPC y Storage.

   • MODO LOCAL (respaldo): sin configuración, todo se guarda en
     localStorage del navegador. Útil para probar sin internet.

   Colecciones → tablas (ver supabase/schema.sql):
     users → profiles · brands → brands + brand_private · products → products
     orders → orders + order_items · reviews → reviews · returns → returns
     messages → contact_messages · wishlist_<uid> → wishlists
     addresses_<uid> → addresses · saved_carts_<uid> → saved_carts · prefs_<uid> → profiles.prefs
   ========================================================= */

const DATA_VERSION = 'v3-clean';
const DB_PREFIX = 'vm_';

/* ---------- Conexión ---------- */
const ENV = window.VM_ENV || {};
const SUPA = (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
const MODE = SUPA ? 'supabase' : 'local';
const IMAGE_BUCKET = 'product-images';
const notify = msg => (typeof toast === 'function' ? toast(msg) : console.warn(msg));

/* ---------- Almacenamiento ----------
   Claves sincronizadas (datos de negocio) → Supabase en modo supabase.
   Claves locales (carrito, cupón, vistas recientes, preferencias de UI) → localStorage siempre. */
const SYNCED_KEYS = ['user', 'users', 'brands', 'products', 'orders', 'reviews', 'returns', 'messages', 'newsletter'];
const SYNCED_PREFIXES = ['wishlist_', 'addresses_', 'saved_carts_', 'prefs_'];
const isSynced = k => MODE === 'supabase' && (SYNCED_KEYS.includes(k) || SYNCED_PREFIXES.some(p => k.startsWith(p)));
const Cache = {};

const Store = {
  _mem: {},
  get(k, d) {
    if (isSynced(k)) return k in Cache ? Cache[k] : d;
    try { const v = localStorage.getItem(DB_PREFIX + k); return v == null ? (k in this._mem ? this._mem[k] : d) : JSON.parse(v); } catch { return k in this._mem ? this._mem[k] : d; }
  },
  set(k, v) {
    if (isSynced(k)) { Cache[k] = v; Remote.persist(k, v); }
    else { this._mem[k] = v; try { localStorage.setItem(DB_PREFIX + k, JSON.stringify(v)); } catch (e) { if (/quota/i.test(e.name + e.message)) notify('El navegador se quedó sin espacio. Conecta Supabase para guardar más productos y fotos.'); } }
    document.dispatchEvent(new CustomEvent('store:' + k));
  },
  del(k) { if (isSynced(k)) { delete Cache[k]; return; } delete this._mem[k]; try { localStorage.removeItem(DB_PREFIX + k); } catch {} },
  wipe() { try { Object.keys(localStorage).filter(k => k.startsWith(DB_PREFIX)).forEach(k => localStorage.removeItem(k)); } catch {} this._mem = {}; },
};

/* Migración: borra datos de demostración de versiones anteriores (una sola vez). */
(function migrate() {
  if (Store.get('data_version', null) !== DATA_VERSION) { Store.wipe(); Store.set('data_version', DATA_VERSION); }
})();

/* ---------- Colecciones genéricas ---------- */
const DB = {
  all(col) { return Store.get(col, []); },
  saveAll(col, list) { Store.set(col, list); },
  get(col, id, key = 'id') { return this.all(col).find(x => x[key] === id) || null; },
  insert(col, item) { const l = this.all(col); l.unshift(item); this.saveAll(col, l); return item; },
  update(col, id, patch, key = 'id') {
    const l = this.all(col); const i = l.findIndex(x => x[key] === id); if (i < 0) return null;
    l[i] = { ...l[i], ...patch }; this.saveAll(col, l); return l[i];
  },
  remove(col, id, key = 'id') { this.saveAll(col, this.all(col).filter(x => x[key] !== id)); },
  /* Escrituras en curso (para no salir de la página antes de guardar) */
  pending: new Set(),
  track(p) { const pr = Promise.resolve(p).finally(() => this.pending.delete(pr)); this.pending.add(pr); return pr; },
  flush(timeout = 6000) { return Promise.race([Promise.allSettled([...this.pending]), new Promise(r => setTimeout(r, timeout))]); },
};
window.addEventListener('beforeunload', e => { if (DB.pending.size) { e.preventDefault(); e.returnValue = ''; } });

/* =========================================================
   ADAPTADOR SUPABASE
   ========================================================= */
const num = v => (v == null ? null : Number(v));
const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));

/* Mapeo fila ↔ objeto de la app para cada tabla */
const TABLES = {
  users: {
    table: 'profiles', select: '*',
    from: r => ({ id: r.id, role: r.role, name: r.name, email: r.email, phone: r.phone || '', city: r.city || '', birth: r.birth || '',
      interests: r.interests || [], status: r.status, brandId: r.brand_id, since: r.created_at }),
    update: u => ({ name: u.name, phone: u.phone || null, city: u.city || null, birth: u.birth || null, interests: u.interests || [], status: u.status, role: u.role }),
    noInsert: true, noDelete: true,
  },
  brands: {
    table: 'brands', select: '*, brand_private(rfc, clabe)',
    from: r => { const bp = Array.isArray(r.brand_private) ? r.brand_private[0] : r.brand_private;
      return { id: r.id, ownerId: r.owner_id, name: r.name, city: r.city || '', color: r.color, since: r.since, tagline: r.tagline || '', desc: r.description || '',
        mainCat: r.main_cat, instagram: r.instagram || '', whatsapp: r.whatsapp || '', status: r.status, commission: num(r.commission), note: r.note || '',
        applied: r.created_at, rfc: bp?.rfc || '', clabe: bp?.clabe || '' }; },
    update: b => ({ city: b.city || null, color: b.color, since: b.since || null, tagline: b.tagline || null, description: b.desc || null,
      instagram: b.instagram || null, whatsapp: b.whatsapp || null, status: b.status, commission: b.commission, note: b.note || null }),
    after: async (b, prev) => {
      if (!prev || prev.rfc !== b.rfc || prev.clabe !== b.clabe) {
        const { error } = await SUPA.from('brand_private').upsert({ brand_id: b.id, rfc: b.rfc || null, clabe: b.clabe || null });
        if (error) throw error;
      }
    },
    noInsert: true,
  },
  products: {
    table: 'products', select: '*',
    from: r => ({ id: Number(r.id), slug: r.slug, name: r.name, brand: r.brand_id, cat: r.cat, sub: r.sub, shape: r.shape, desc: r.description, details: r.details || '',
      price: num(r.price), compareAt: num(r.compare_at), colors: r.colors || [], sizes: r.sizes || [], stock: r.stock || {}, specs: r.specs || {},
      features: r.features || [], images: r.images || [], weight: r.weight, dims: r.dims || '', status: r.status, rejectReason: r.reject_reason || '',
      sales: r.sales || 0, created: r.created_at, published: r.published_at }),
    insert: p => ({ id: p.id, brand_id: p.brand, ...TABLES.products.update(p) }),
    update: p => ({ name: p.name, slug: p.slug || null, cat: p.cat, sub: p.sub, shape: p.shape || null, description: p.desc, details: p.details || null,
      price: p.price, compare_at: p.compareAt || null, colors: p.colors, sizes: p.sizes, stock: p.stock, specs: p.specs || {}, features: p.features || [],
      images: p.images || [], weight: p.weight || null, dims: p.dims || null, status: p.status, reject_reason: p.rejectReason || null }),
    skip: p => p._stub,
  },
  orders: {
    table: 'orders', select: '*, order_items(*)',
    from: r => ({ id: r.id, date: r.created_at, email: r.email, phone: r.phone, buyerId: r.user_id, guest: r.guest, status: r.status,
      items: (r.order_items || []).sort((a, b) => a.id - b.id).map(i => ({ id: Number(i.product_id), name: i.name, brand: i.brand_id, color: i.color, size: i.size, qty: i.qty, price: num(i.price) })),
      totals: { subtotal: num(r.subtotal), discount: num(r.discount), ship: num(r.shipping_cost), total: num(r.total), iva: num(r.iva), code: r.coupon },
      payment: r.payment || {}, shipping: r.shipping || {}, address: r.address || {}, vendorStatus: r.vendor_status || {}, vendorTracking: r.vendor_tracking || {},
      history: r.history || [], payRef: r.pay_ref, payExpires: r.pay_expires }),
    update: o => ({ status: o.status, shipping: o.shipping, vendor_status: o.vendorStatus || {}, vendor_tracking: o.vendorTracking || {}, history: o.history || [] }),
    noInsert: true, // los pedidos se crean solo con place_order()
  },
  reviews: {
    table: 'reviews', select: '*',
    from: r => ({ id: Number(r.id), productId: Number(r.product_id), userId: r.user_id, name: r.name, rating: r.rating, title: r.title, text: r.body,
      verified: r.verified, helpful: r.helpful, status: r.status, reply: r.reply, date: r.created_at }),
    insert: r => ({ id: r.id, product_id: r.productId, name: r.name, rating: r.rating, title: r.title, body: r.text }),
    update: r => ({ status: r.status, reply: r.reply || null }),
    returning: true,
  },
  returns: {
    table: 'returns', select: '*',
    from: r => ({ id: r.id, orderId: r.order_id, email: r.email, userId: r.user_id, productId: num(r.product_id), brand: r.brand_id, color: r.color, size: r.size,
      qty: r.qty, amount: num(r.amount), reason: r.reason, comment: r.comment || '', status: r.status, adminNote: r.admin_note || '', date: r.created_at }),
    insert: r => ({ id: r.id, order_id: r.orderId, product_id: r.productId, color: r.color, size: r.size, qty: r.qty, reason: r.reason, comment: r.comment || null }),
    update: r => ({ status: r.status, admin_note: r.adminNote || null }),
    returning: true,
  },
  messages: {
    table: 'contact_messages', select: '*',
    from: r => ({ id: Number(r.id), name: r.name, email: r.email, topic: r.topic || '', orderRef: r.order_ref || '', message: r.message, status: r.status, reply: r.reply || '', date: r.created_at }),
    insert: m => ({ name: m.name, email: m.email, topic: m.topic || null, order_ref: m.orderRef || null, message: m.message }),
    update: m => ({ status: m.status, reply: m.reply || null }),
  },
};

const Remote = {
  snap: {},            // última versión guardada de cada fila (para detectar cambios)
  queue: {},           // escrituras en serie por colección
  adminExists: false,

  /* Guarda los cambios de una colección: compara con la última versión y manda solo lo distinto */
  persist(k, v) {
    if (k === 'user' || k === 'newsletter') return;
    const run = () => (TABLES[k] ? this.diffTable(k, v) : this.persistPrefixed(k, v));
    this.queue[k] = (this.queue[k] || Promise.resolve()).then(run).catch(err => {
      this.lastError = err;
      console.error('[VibeMarket] Error al guardar', k, err);
      notify('No se pudo guardar en la base de datos: ' + (err.message || err));
    });
    DB.track(this.queue[k]);
  },

  async diffTable(k, list) {
    const spec = TABLES[k], snap = this.snap[k] ||= new Map();
    const seen = new Set();
    for (const item of list) {
      if (spec.skip && spec.skip(item)) continue;
      seen.add(String(item.id));
      const prev = snap.get(String(item.id));
      if (!prev) {
        if (spec.noInsert) continue;
        snap.set(String(item.id), JSON.parse(JSON.stringify(item)));
        let q = SUPA.from(spec.table).insert(spec.insert(item));
        if (spec.returning) q = q.select(spec.select).single();
        const { data, error } = await q;
        if (error) { snap.delete(String(item.id)); throw error; }
        if (data) { // valores calculados por el servidor (verificado, monto, etc.)
          const fresh = spec.from(data); Object.assign(item, fresh);
          snap.set(String(item.id), JSON.parse(JSON.stringify(item)));
          document.dispatchEvent(new CustomEvent('store:' + k));
        }
      } else if (JSON.stringify(spec.update(prev)) !== JSON.stringify(spec.update(item)) || (spec.after && (prev.rfc !== item.rfc || prev.clabe !== item.clabe))) {
        snap.set(String(item.id), JSON.parse(JSON.stringify(item)));
        const { error } = await SUPA.from(spec.table).update(spec.update(item)).eq('id', item.id);
        if (error) throw error;
        if (spec.after) await spec.after(item, prev);
      }
    }
    if (!spec.noDelete) {
      for (const id of [...snap.keys()]) {
        if (seen.has(id)) continue;
        snap.delete(id);
        const { error } = await SUPA.from(spec.table).delete().eq('id', k === 'products' || k === 'reviews' || k === 'messages' ? Number(id) : id);
        if (error) throw error;
      }
    }
  },

  async persistPrefixed(k, v) {
    const uid = Auth.user()?.id; if (!uid) return;
    if (k.startsWith('wishlist_')) {
      const prev = new Set(this.snap[k] || []), next = new Set(v);
      this.snap[k] = [...next];
      const add = [...next].filter(x => !prev.has(x)).map(product_id => ({ user_id: uid, product_id }));
      const del = [...prev].filter(x => !next.has(x));
      if (add.length) { const { error } = await SUPA.from('wishlists').insert(add); if (error) throw error; }
      for (const product_id of del) { const { error } = await SUPA.from('wishlists').delete().eq('user_id', uid).eq('product_id', product_id); if (error) throw error; }
    } else if (k.startsWith('addresses_')) {
      let { error } = await SUPA.from('addresses').delete().eq('user_id', uid); if (error) throw error;
      if (v.length) ({ error } = await SUPA.from('addresses').insert(v.map((a, i) => ({ user_id: uid, position: i, label: a.label, fname: a.fname, lname: a.lname || '', street: a.street, colonia: a.colonia, cp: a.cp, city: a.city, state: a.state }))));
      if (error) throw error;
    } else if (k.startsWith('saved_carts_')) {
      let { error } = await SUPA.from('saved_carts').delete().eq('user_id', uid); if (error) throw error;
      if (v.length) ({ error } = await SUPA.from('saved_carts').insert(v.map(c => ({ user_id: uid, name: c.name, items: c.items, created_at: c.date }))));
      if (error) throw error;
    } else if (k.startsWith('prefs_')) {
      const { error } = await SUPA.from('profiles').update({ prefs: v }).eq('id', uid); if (error) throw error;
    }
  },

  /* Carga inicial: todo lo que el usuario tiene permitido ver */
  async init() {
    const q = async (k, filter) => {
      const spec = TABLES[k]; let req = SUPA.from(spec.table).select(spec.select);
      if (filter) req = filter(req);
      const { data, error } = await req;
      if (error) { console.error('[VibeMarket] Error al cargar', k, error); notify('Error al cargar datos: ' + error.message); return []; }
      return data.map(spec.from);
    };
    const [{ data: sess }, { data: adminExists }] = await Promise.all([SUPA.auth.getSession(), SUPA.rpc('admin_exists')]);
    this.adminExists = !!adminExists;
    let me = null;
    if (sess?.session) {
      const { data: prof } = await SUPA.from('profiles').select('*').eq('id', sess.session.user.id).maybeSingle();
      if (prof && prof.status === 'active') me = TABLES.users.from(prof);
      else await SUPA.auth.signOut({ scope: 'local' });
    }
    Cache.user = me ? { id: me.id, email: me.email, name: me.name, role: me.role, brandId: me.brandId } : null;
    const isAdmin = me?.role === 'admin';

    const jobs = { brands: q('brands'), products: q('products'), reviews: q('reviews') };
    if (me) {
      jobs.orders = q('orders', r => r.order('created_at', { ascending: false }));
      jobs.returns = q('returns', r => r.order('created_at', { ascending: false }));
      jobs.users = isAdmin ? q('users', r => r.order('created_at', { ascending: false })) : Promise.resolve([me]);
      if (isAdmin) jobs.messages = q('messages', r => r.order('created_at', { ascending: false }));
      if (me.role === 'buyer') {
        jobs.wishlist = SUPA.from('wishlists').select('product_id').eq('user_id', me.id).then(r => (r.data || []).map(x => Number(x.product_id)));
        jobs.addresses = SUPA.from('addresses').select('*').eq('user_id', me.id).order('position').then(r => r.data || []);
        jobs.carts = SUPA.from('saved_carts').select('*').eq('user_id', me.id).order('created_at', { ascending: false }).then(r => r.data || []);
        jobs.prefs = SUPA.from('profiles').select('prefs').eq('id', me.id).single().then(r => r.data?.prefs || null);
        jobs.votes = SUPA.from('review_votes').select('review_id').eq('user_id', me.id).then(r => (r.data || []).map(x => Number(x.review_id)));
      }
    }
    const keys = Object.keys(jobs), vals = await Promise.all(Object.values(jobs));
    const R = Object.fromEntries(keys.map((k, i) => [k, vals[i]]));

    ['brands', 'products', 'orders', 'reviews', 'returns', 'users', 'messages'].forEach(k => { Cache[k] = R[k] || []; });
    // Dueño de cada marca (para el admin)
    BRANDS.splice(0, BRANDS.length, ...Cache.brands.map(b => ({ ...b, owner: (Cache.users.find(u => u.id === b.ownerId) || {}).email || '' })));
    Cache.brands = BRANDS;
    PRODUCTS.splice(0, PRODUCTS.length, ...Cache.products); Cache.products = PRODUCTS;
    // Productos que ya no son visibles (pausados/borrados) pero aparecen en pedidos o devoluciones
    const stub = (id, it) => { if (!id || getProduct(id)) return; PRODUCTS.push({ id, _stub: true, name: it.name || 'Producto no disponible', brand: it.brand, cat: '', sub: '', shape: 'vase',
      desc: '', price: it.price || it.amount || 0, colors: [it.color || 'arena'], sizes: [it.size || 'Única'], stock: {}, specs: {}, features: [], images: [], status: 'archived', sales: 0 }); };
    Cache.orders.forEach(o => o.items.forEach(it => stub(it.id, it)));
    Cache.returns.forEach(r => stub(r.productId, r));
    Cache.reviews.forEach(r => stub(r.productId, {}));

    for (const k of Object.keys(TABLES)) this.snap[k] = new Map((Cache[k] || []).filter(x => !x._stub).map(x => [String(x.id), JSON.parse(JSON.stringify(x))]));
    if (me?.role === 'buyer') {
      Cache['wishlist_' + me.id] = R.wishlist; this.snap['wishlist_' + me.id] = [...R.wishlist];
      Cache['addresses_' + me.id] = R.addresses.map(a => ({ label: a.label, fname: a.fname, lname: a.lname, street: a.street, colonia: a.colonia, cp: a.cp, city: a.city, state: a.state }));
      Cache['saved_carts_' + me.id] = R.carts.map(c => ({ name: c.name, date: c.created_at, items: c.items }));
      if (R.prefs && Object.keys(R.prefs).length) Cache['prefs_' + me.id] = R.prefs;
      try { localStorage.setItem(DB_PREFIX + 'voted_' + me.id, JSON.stringify(R.votes)); } catch {}
    }
  },
};

/* =========================================================
   API PÚBLICA (la usan todas las páginas)
   ========================================================= */

/* ---------- Usuarios ---------- */
const Users = {
  all() { return DB.all('users'); },
  byEmail(email) { return this.all().find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null; },
  byRole(role) { return this.all().filter(u => u.role === role); },
  hasAdmin() { return MODE === 'supabase' ? Remote.adminExists : this.all().some(u => u.role === 'admin'); },
  create(data) { return DB.insert('users', { id: 'u' + Date.now().toString(36), status: 'active', since: new Date().toISOString(), ...data }); },
  update(id, patch) { return DB.update('users', id, patch); },
};

/* ---------- Sesión y cuentas (Supabase Auth en producción) ---------- */
const Auth = {
  users() { return Users.all(); },
  user() { return Store.get('user', null); },
  find(email) { return Users.byEmail(email); },
  profile() { const s = this.user(); return s ? (Users.all().find(u => u.id === s.id) || this.find(s.email)) : null; },

  /** Inicia sesión validando el tipo de cuenta. Devuelve {ok, msg, user}. */
  async login(email, pass, role) {
    if (MODE === 'supabase') {
      const { error } = await SUPA.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) return { ok: false, msg: /confirm/i.test(error.message) ? 'Confirma tu correo: te enviamos un enlace al registrarte.' : 'Correo o contraseña incorrectos' };
      const { data: prof } = await SUPA.from('profiles').select('*').eq('id', (await SUPA.auth.getUser()).data.user.id).single();
      if (!prof) { await SUPA.auth.signOut({ scope: 'local' }); return { ok: false, msg: 'No encontramos tu perfil. Contacta a soporte.' }; }
      if (prof.role !== role) { await SUPA.auth.signOut({ scope: 'local' }); return { ok: false, msg: `Esta cuenta es de ${ROLE_LABEL[prof.role]}. Elige ese tipo de acceso.` }; }
      if (prof.status === 'suspended') { await SUPA.auth.signOut({ scope: 'local' }); return { ok: false, msg: 'Tu cuenta está suspendida. Contacta a soporte.' }; }
      const session = { id: prof.id, email: prof.email, name: prof.name, role: prof.role, brandId: prof.brand_id };
      Cache.user = session;
      return { ok: true, user: session };
    }
    const u = this.find(email);
    if (!u || u.pass !== pass) return { ok: false, msg: 'Correo o contraseña incorrectos' };
    if (u.role !== role) return { ok: false, msg: `Esta cuenta es de ${ROLE_LABEL[u.role]}. Elige ese tipo de acceso.` };
    if (u.status === 'suspended') return { ok: false, msg: 'Tu cuenta está suspendida. Contacta a soporte.' };
    const session = { id: u.id, email: u.email, name: u.name, role: u.role, brandId: u.brandId || null };
    Store.set('user', session);
    return { ok: true, user: session };
  },

  /** Crea una cuenta. data: {role, name, email, pass, phone, city, interests, prefs, brand?} */
  async register(data) {
    if (MODE === 'supabase') {
      const { pass, email, ...meta } = data;
      const { data: res, error } = await SUPA.auth.signUp({ email: email.trim(), password: pass, options: { data: meta, emailRedirectTo: location.origin + '/login.html?role=' + data.role } });
      if (error) return { ok: false, msg: /registered|exists/i.test(error.message) ? 'Ya existe una cuenta con ese correo'
        : /rate limit/i.test(error.message) ? 'Supabase bloqueó el registro por exceso de correos de confirmación. El administrador debe desactivar "Confirm email" en Supabase (Authentication › Sign In / Providers › Email) o esperar una hora.'
        : /password/i.test(error.message) ? 'La contraseña no cumple los requisitos de seguridad (mínimo 6 caracteres).'
        : error.message };
      if (res.user && Array.isArray(res.user.identities) && res.user.identities.length === 0) return { ok: false, msg: 'Ya existe una cuenta con ese correo' };
      if (!res.session) return { ok: true, needsConfirm: true };
      return this.login(email, pass, data.role);
    }
    if (Users.byEmail(data.email)) return { ok: false, msg: 'Ya existe una cuenta con ese correo' };
    if (data.role === 'admin' && Users.hasAdmin()) data.role = 'buyer';
    const { brand, ...rest } = data;
    let brandId = null;
    if (data.role === 'vendor' && brand) {
      brandId = normalizeSlug(brand.name); if (getBrand(brandId)) brandId += '-' + Date.now().toString(36).slice(-4);
      saveBrand({ id: brandId, name: brand.name, city: brand.city, color: brand.color, since: brand.since, tagline: brand.tagline, desc: brand.desc, mainCat: brand.mainCat,
        instagram: brand.instagram, whatsapp: brand.whatsapp, rfc: brand.rfc, clabe: brand.clabe, status: 'pending', commission: DEFAULT_COMMISSION, owner: data.email, applied: new Date().toISOString() });
    }
    const u = Users.create({ ...rest, brandId });
    if (rest.prefs) Store.set('prefs_' + u.id, rest.prefs);
    return this.login(data.email, data.pass, u.role);
  },

  update(id, patch) {
    const u = Users.update(id, patch); if (!u) return;
    const s = this.user(); if (s && s.id === id) Store.set('user', { ...s, name: u.name, email: u.email });
  },

  async changePassword(current, next) {
    const s = this.user(); if (!s) return { ok: false, msg: 'Inicia sesión' };
    if (MODE === 'supabase') {
      const { error: e1 } = await SUPA.auth.signInWithPassword({ email: s.email, password: current });
      if (e1) return { ok: false, msg: 'La contraseña actual no es correcta' };
      const { error } = await SUPA.auth.updateUser({ password: next });
      return error ? { ok: false, msg: error.message } : { ok: true };
    }
    if (this.profile().pass !== current) return { ok: false, msg: 'La contraseña actual no es correcta' };
    Users.update(s.id, { pass: next }); return { ok: true };
  },

  async resetPassword(email) {
    if (MODE !== 'supabase') return { ok: false, msg: 'La recuperación de contraseña requiere conectar Supabase' };
    const { error } = await SUPA.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/login.html' });
    return error ? { ok: false, msg: error.message } : { ok: true };
  },

  logout() {
    if (MODE === 'supabase') { Cache.user = null; DB.track(SUPA.auth.signOut({ scope: 'local' })); return; }
    Store.del('user');
  },

  /** Protege una página: si el rol no coincide, manda a login */
  require(role) {
    const u = this.user();
    if (u && u.role === role) return u;
    location.replace(withHash(`login.html?role=${role}&next=${encodeURIComponent(location.pathname.split('/').pop() + location.hash)}`));
    return null;
  },
};
const normalizeSlug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- Marcas ---------- */
const BRANDS = MODE === 'local' ? DB.all('brands') : [];
const getBrand = id => BRANDS.find(b => b.id === id) || null;
function saveBrand(b) {
  const i = BRANDS.findIndex(x => x.id === b.id); if (i > -1) BRANDS[i] = b; else BRANDS.push(b);
  DB.saveAll('brands', BRANDS);
}

/* ---------- Productos ---------- */
const PRODUCTS = MODE === 'local' ? DB.all('products') : [];
const getProduct = id => PRODUCTS.find(p => p.id === Number(id)) || null;
function saveProduct(p) {
  const i = PRODUCTS.findIndex(x => x.id === p.id); if (i > -1) PRODUCTS[i] = p; else PRODUCTS.push(p);
  DB.saveAll('products', PRODUCTS);
}
function deleteProduct(id) {
  const i = PRODUCTS.findIndex(x => x.id === id); if (i > -1) PRODUCTS.splice(i, 1);
  DB.saveAll('products', PRODUCTS);
}
const nextProductId = () => MODE === 'supabase' ? Date.now() : Math.max(0, ...PRODUCTS.map(p => p.id)) + 1;
const totalStock = p => Object.values(p.stock || {}).reduce((a, n) => a + n, 0);

/** Productos visibles en la tienda: aprobados por el admin y de marcas aprobadas */
function activeProducts() {
  return PRODUCTS.filter(p => p.status === 'active' && (getBrand(p.brand) || {}).status === 'approved');
}
/** Novedades: publicados en los últimos 45 días (o los 8 más recientes) */
function newProducts() {
  const all = activeProducts().sort((a, b) => new Date(b.published || b.created) - new Date(a.published || a.created));
  const recent = all.filter(p => (Date.now() - new Date(p.published || p.created)) / 864e5 <= 45);
  return recent.length ? recent : all.slice(0, 8);
}
const isNewProduct = p => (Date.now() - new Date(p.published || p.created)) / 864e5 <= 21;

/* ---------- Fotos de productos (Supabase Storage) ---------- */
const Media = {
  /** Sube una imagen (data URL) y devuelve su URL pública. En modo local devuelve la misma data URL. */
  async upload(dataUrl, folder) {
    if (MODE !== 'supabase' || !String(dataUrl).startsWith('data:')) return dataUrl;
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await SUPA.storage.from(IMAGE_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return SUPA.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  },
  uploadAll(list, folder) { return Promise.all((list || []).map(src => this.upload(src, folder))); },
};

/* ---------- Reseñas ---------- */
const Reviews = {
  all() { return DB.all('reviews'); },
  saveAll(list) { DB.saveAll('reviews', list); },
  forProduct(id, onlyPublished = true) { return this.all().filter(r => r.productId === id && (!onlyPublished || r.status === 'published')); },
  add(r) { return DB.insert('reviews', { id: Date.now(), date: new Date().toISOString(), helpful: 0, status: 'published', reply: null, ...r }); },
  update(id, patch) { return DB.update('reviews', id, patch); },
  /** Voto "útil" (uno por usuario) */
  async vote(id) {
    const all = this.all(); const r = all.find(x => x.id === id); if (!r) return null;
    if (MODE === 'supabase') {
      const { data, error } = await SUPA.rpc('vote_review', { rid: id });
      if (error) throw error;
      r.helpful = data; Cache.reviews = all; Remote.snap.reviews?.set(String(id), JSON.parse(JSON.stringify(r)));
      return data;
    }
    r.helpful++; this.saveAll(all); return r.helpful;
  },
};
/** Calificación real calculada a partir de las reseñas publicadas */
function ratingOf(p) {
  const l = Reviews.forProduct(p.id);
  return { avg: l.length ? l.reduce((a, r) => a + r.rating, 0) / l.length : 0, count: l.length };
}

/* ---------- Devoluciones ---------- */
const Returns = {
  all() { return DB.all('returns'); },
  saveAll(list) { DB.saveAll('returns', list); },
  newId() { return 'DV-' + Date.now().toString(36).toUpperCase().slice(-6); },
  add(r) { return DB.insert('returns', { id: this.newId(), date: new Date().toISOString(), status: 'requested', ...r }); },
  update(id, patch) { return DB.update('returns', id, patch); },
};

/* ---------- Mensajes de contacto ---------- */
const Messages = {
  all() { return DB.all('messages'); },
  add(m) { return DB.insert('messages', { id: Date.now(), date: new Date().toISOString(), status: 'new', reply: '', ...m }); },
  update(id, patch) { return DB.update('messages', id, patch); },
};

/* ---------- Newsletter ---------- */
const Newsletter = {
  async subscribe(email, interests) {
    if (MODE === 'supabase') { const { error } = await SUPA.rpc('subscribe_newsletter', { p_email: email, p_interests: interests }); if (error) throw error; return; }
    const subs = DB.all('newsletter').filter(s => s.email !== email);
    DB.saveAll('newsletter', [{ email, interests, date: new Date().toISOString() }, ...subs]);
  },
};

/* ---------- Pedidos ---------- */
const Orders = {
  all() { return DB.all('orders'); },
  save(list) { DB.saveAll('orders', list); },
  get(id) { return DB.get('orders', id); },
  update(id, patch) { return DB.update('orders', id, patch); },
  /** Agrega un evento al historial del pedido */
  log(o, status, title, detail = '') { (o.history ||= []).push({ status, title, detail, date: new Date().toISOString() }); return o; },
  /** Cambia el estado y deja constancia en el historial */
  setStatus(id, status, title, detail = '') {
    const l = this.all(); const o = l.find(x => x.id === id); if (!o) return null;
    o.status = status; this.log(o, status, title || STATUS_LABEL[status], detail); this.save(l); return o;
  },
  nextNumber() { return 'VM-' + (Math.max(10000, ...this.all().map(o => +String(o.id).split('-')[1] || 0)) + 1); },

  /**
   * Registra un pedido ya "pagado" (pago simulado).
   * draft: {email, phone, items:[{id,color,size,qty}], coupon, shippingCost, shipping:{method,carrier,eta}, address, payment:{method,status,label,last4,card_brand,installments}}
   * En Supabase: place_order() recalcula precios/stock en el servidor y descuenta inventario.
   */
  async place(draft) {
    if (MODE === 'supabase') {
      const { data, error } = await SUPA.rpc('place_order', { p: {
        email: draft.email, phone: draft.phone, items: draft.items.map(i => ({ id: i.id, color: i.color, size: i.size, qty: i.qty })),
        coupon: draft.coupon || null, shipping_cost: draft.shippingCost, shipping: draft.shipping, address: draft.address, payment: draft.payment } });
      if (error) throw new Error(error.message);
      const o = TABLES.orders.from({ ...data, order_items: data.items });
      if (Auth.user()) { const l = this.all(); l.unshift(o); Cache.orders = l; Remote.snap.orders?.set(o.id, JSON.parse(JSON.stringify(o))); }
      o.items.forEach(i => { const p = getProduct(i.id); if (p) { const k = `${i.color}|${i.size}`; p.stock[k] = Math.max(0, (p.stock[k] || 0) - i.qty); p.sales = (p.sales || 0) + i.qty; Remote.snap.products?.set(String(p.id), JSON.parse(JSON.stringify(p))); } });
      return o;
    }
    // ----- Modo local: misma validación que el servidor -----
    let subtotal = 0;
    for (const i of draft.items) {
      const p = getProduct(i.id); const k = `${i.color}|${i.size}`;
      if (!p || p.status !== 'active') throw new Error('Un producto ya no está disponible');
      if (i.qty > (p.stock[k] || 0)) throw new Error(`Stock insuficiente de "${p.name}" (${i.color} / ${i.size}): quedan ${p.stock[k] || 0}`);
      subtotal += p.price * i.qty;
    }
    const c = draft.coupon ? COUPONS[draft.coupon] : null;
    let discount = 0, ship = Math.max(0, draft.shippingCost || 0);
    if (c && (!c.min || subtotal >= c.min)) { if (c.type === 'percent') discount = Math.round(subtotal * c.value) / 100; if (c.type === 'fixed') discount = Math.min(c.value, subtotal); if (c.type === 'shipping') ship = 0; }
    const total = subtotal - discount + ship;
    const oxxo = draft.payment.method === 'oxxo';
    const u = Auth.user();
    const o = { id: this.nextNumber(), date: new Date().toISOString(), email: u ? u.email : draft.email, phone: draft.phone, buyerId: u ? u.id : null, guest: !u,
      status: oxxo ? 'pending_payment' : 'paid',
      items: draft.items.map(i => { const p = getProduct(i.id); return { id: p.id, name: p.name, brand: p.brand, color: i.color, size: i.size, qty: i.qty, price: p.price }; }),
      totals: { subtotal, discount, ship, total, iva: +(total - total / 1.16).toFixed(2), code: c && (!c.min || subtotal >= c.min) ? draft.coupon : null },
      payment: { ...draft.payment, status: oxxo ? 'pending' : 'approved', auth_code: oxxo ? null : Math.random().toString(36).slice(2, 10).toUpperCase(), simulated: true },
      shipping: { ...draft.shipping, tracking: null }, address: draft.address, vendorStatus: {}, vendorTracking: {}, history: [] };
    if (oxxo) { o.payRef = '9300 ' + String(Math.floor(1000 + Math.random() * 9000)) + ' ' + String(Math.floor(1000 + Math.random() * 9000)); o.payExpires = new Date(Date.now() + 72 * 36e5).toISOString(); }
    o.items.forEach(i => o.vendorStatus[i.brand] = 'pending');
    this.log(o, 'received', 'Pedido recibido', `${o.items.reduce((a, i) => a + i.qty, 0)} producto(s) · ${moneyShort(total)} MXN`);
    this.log(o, oxxo ? 'pending_payment' : 'paid', oxxo ? 'Esperando pago en OXXO' : 'Pago aprobado (simulado)', oxxo ? 'Referencia ' + o.payRef : draft.payment.label);
    this.save([o, ...this.all()]);
    o.items.forEach(i => { const p = getProduct(i.id); const k = `${i.color}|${i.size}`; p.stock[k] -= i.qty; p.sales = (p.sales || 0) + i.qty; saveProduct(p); });
    if (u && !Store.get('addresses_' + u.id, []).length) Store.set('addresses_' + u.id, [{ label: 'Casa', ...draft.address }]);
    return o;
  },

  /** Desglose por marca: subtotal, comisión de VibeMarket y neto para la marca */
  split(o) {
    const out = {};
    o.items.forEach(it => {
      const p = getProduct(it.id); const brandId = it.brand || p?.brand; if (!brandId) return;
      const b = getBrand(brandId) || { commission: DEFAULT_COMMISSION };
      const line = (it.price ?? p?.price ?? 0) * it.qty;
      const r = out[brandId] ||= { brand: brandId, subtotal: 0, commission: 0, net: 0, items: [], rate: b.commission };
      r.subtotal += line; r.items.push(it);
    });
    Object.values(out).forEach(r => { r.commission = Math.round(r.subtotal * r.rate) / 100; r.net = r.subtotal - r.commission; });
    return out;
  },
};

/* ---------- Arranque: las páginas esperan a que los datos estén listos ---------- */
const DBReady = (async () => {
  if (MODE !== 'supabase') return;
  document.documentElement.classList.add('vm-loading');
  try { await Remote.init(); }
  catch (e) { console.error('[VibeMarket] No se pudo conectar con Supabase', e); setTimeout(() => notify('No se pudo conectar con la base de datos. Revisa tu conexión.'), 300); }
  finally { document.documentElement.classList.remove('vm-loading'); }
})();
/** Ejecuta fn cuando el HTML y los datos estén listos (reemplaza DOMContentLoaded) */
function onReady(fn) {
  const run = () => DBReady.then(fn);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
}

/* Modo local: si otra pestaña cambia los datos, recargamos la vista */
window.addEventListener('storage', e => {
  if (MODE === 'local' && document.body?.dataset.shell !== 'panel' && e.key && e.key.startsWith(DB_PREFIX) && ['products', 'brands'].some(k => e.key === DB_PREFIX + k)) location.reload();
});
console.info(`[VibeMarket] Modo de datos: ${MODE === 'supabase' ? 'Supabase (' + ENV.SUPABASE_URL + ')' : 'local (localStorage)'}`);
