/* =========================================================
   VibeMarket — Cotización de envío, cupones y totales
   Simula las APIs de paquetería (Envia.com / Skydropx).
   En producción: POST /api/shipping/quote → backend → API externa.
   ========================================================= */
const Shipping = {
  // Zonas por primer dígito de C.P. (México)
  zone(cp) {
    const d = Number(String(cp)[0]);
    if ([0, 1, 5].includes(d)) return { name: 'Centro (CDMX / Edomex)', factor: 1, days: [1, 3] };
    if ([3, 4, 6, 7].includes(d)) return { name: 'Bajío / Occidente / Noreste', factor: 1.15, days: [2, 4] };
    return { name: 'Sur / Sureste / Noroeste', factor: 1.35, days: [3, 6] };
  },
  quote(cp, subtotal) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!/^\d{5}$/.test(String(cp))) return reject(new Error('Ingresa un código postal válido de 5 dígitos'));
        const z = this.zone(cp);
        const free = subtotal >= FREE_SHIPPING_MIN;
        const addDays = (n) => { const d = new Date(); let c = 0; while (c < n) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) c++; } return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }); };
        resolve({
          zone: z.name,
          options: [
            { id: 'standard', carrier: 'Estafeta', name: 'Estándar', cost: free ? 0 : Math.round(99 * z.factor), eta: `${addDays(z.days[0] + 2)} – ${addDays(z.days[1] + 2)}` },
            { id: 'express', carrier: 'DHL Express', name: 'Express', cost: Math.round(189 * z.factor) - (free ? 90 : 0), eta: `${addDays(z.days[0])} – ${addDays(z.days[0] + 1)}` },
            { id: 'pickup', carrier: 'Punto de recolección', name: 'Recoger en punto Pickit', cost: 0, eta: `Desde ${addDays(z.days[0] + 1)}` },
          ],
        });
      }, 550);
    });
  },
};

const Pricing = {
  coupon() { return Store.get('coupon', null); },
  applyCoupon(code, subtotal) {
    const c = COUPONS[String(code).trim().toUpperCase()];
    if (!c) return { ok: false, msg: 'Código no válido o expirado' };
    if (c.min && subtotal < c.min) return { ok: false, msg: `Este código requiere una compra mínima de ${moneyShort(c.min)}` };
    Store.set('coupon', String(code).trim().toUpperCase());
    return { ok: true, msg: `Código aplicado: ${c.label}` };
  },
  removeCoupon() { Store.del('coupon'); },
  totals(shippingCost = null) {
    const subtotal = Cart.subtotal();
    const code = this.coupon(), c = code ? COUPONS[code] : null;
    let discount = 0, ship = shippingCost;
    if (c && (!c.min || subtotal >= c.min)) {
      if (c.type === 'percent') discount = Math.round(subtotal * c.value) / 100;
      if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
      if (c.type === 'shipping' && ship != null) ship = 0;
    }
    const total = Math.max(0, subtotal - discount + (ship || 0));
    const iva = +(total - total / 1.16).toFixed(2); // IVA incluido (16%)
    return { subtotal, discount, ship, total, iva, code: c && (!c.min || subtotal >= c.min) ? code : null };
  },
};
