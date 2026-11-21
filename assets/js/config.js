/* =========================================================
   VibeMarket — Configuración del catálogo (no son datos de prueba)
   Taxonomía, paleta de variantes, cupones y reglas de envío.
   En Supabase: tablas categories y coupons (supabase/schema.sql, sección 8).
   ========================================================= */

const CATEGORIES = [
  { id: 'moda', name: 'Moda', desc: 'Prendas de autor', subs: [
    { id: 'ropa', name: 'Ropa' }, { id: 'bolsas', name: 'Bolsas' }, { id: 'accesorios-moda', name: 'Accesorios' } ] },
  { id: 'hogar', name: 'Hogar', desc: 'Objetos con alma', subs: [
    { id: 'decoracion', name: 'Decoración' }, { id: 'cocina', name: 'Cocina & Mesa' }, { id: 'velas', name: 'Velas & Aromas' } ] },
  { id: 'belleza', name: 'Belleza', desc: 'Rituales botánicos', subs: [
    { id: 'skincare', name: 'Skincare' }, { id: 'corporal', name: 'Cuidado corporal' } ] },
  { id: 'joyeria', name: 'Joyería', desc: 'Piezas únicas', subs: [
    { id: 'aretes', name: 'Aretes' }, { id: 'collares', name: 'Collares' } ] },
  { id: 'papeleria', name: 'Papelería', desc: 'Para crear', subs: [
    { id: 'cuadernos', name: 'Cuadernos' }, { id: 'arte', name: 'Arte & Prints' } ] },
];

const FEATURES = ['Hecho a mano', 'Sustentable', 'Vegano', 'Edición limitada', 'Hecho en México'];

const C = { // paleta de variantes de color
  arena: { name: 'Arena', hex: '#D9C8B0' }, terracota: { name: 'Terracota', hex: '#B8643F' },
  bosque: { name: 'Bosque', hex: '#2F4A3A' }, hueso: { name: 'Hueso', hex: '#EFE7DA' },
  carbon: { name: 'Carbón', hex: '#3A3B39' }, salvia: { name: 'Salvia', hex: '#9AAA8E' },
  ambar: { name: 'Ámbar', hex: '#C08B4A' }, plata: { name: 'Plata', hex: '#C9CBCC' },
  oro: { name: 'Oro', hex: '#C9A55A' }, niebla: { name: 'Niebla', hex: '#A9B4BC' },
  rosa: { name: 'Rosa arcilla', hex: '#D4A595' },
};

const COUPONS = {
  VIBE10: { type: 'percent', value: 10, label: '10% de descuento' },
  BIENVENIDA15: { type: 'percent', value: 15, label: '15% primera compra', min: 800 },
  ENVIOGRATIS: { type: 'shipping', value: 0, label: 'Envío gratis' },
  MENOS200: { type: 'fixed', value: 200, label: '$200 de descuento', min: 1500 },
};

const FREE_SHIPPING_MIN = 999;

const SHAPE_BY_SUB = { ropa: 'shirt', bolsas: 'bag', 'accesorios-moda': 'scarf', decoracion: 'vase', cocina: 'bowl', velas: 'candle', skincare: 'bottle', corporal: 'soap', aretes: 'earrings', collares: 'necklace', cuadernos: 'notebook', arte: 'print' };

/* Etiquetas de estados y roles */
const ROLE_LABEL = { buyer: 'Comprador', vendor: 'Vendedor', admin: 'Administrador' };
const ROLE_HOME = { buyer: 'account.html', vendor: 'vendor.html', admin: 'admin.html' };
const STATUS_LABEL = { pending_payment: 'Pago pendiente', paid: 'Pagado', preparing: 'Preparando', shipped: 'En camino', delivered: 'Entregado', cancelled: 'Cancelado', refunded: 'Reembolsado' };
const RETURN_LABEL = { requested: 'Solicitada', approved: 'Aprobada', rejected: 'Rechazada', received: 'Recibida por la marca', refunded: 'Reembolsada' };
const DEFAULT_COMMISSION = 12; // % que retiene VibeMarket por venta

const getCategory = id => CATEGORIES.find(c => c.id === id);
const getSub = id => { for (const c of CATEGORIES) { const s = c.subs.find(x => x.id === id); if (s) return { ...s, parent: c }; } return null; };

/* =========================================================
   DATOS DE LA EMPRESA — edítalos aquí; se usan en toda la página
   (pie de página, Ayuda › Contacto, chat, seguimiento de pedidos).
   ========================================================= */
const COMPANY = {
  name: 'VibeMarket',
  legalName: 'VibeMarket',                // razón social (opcional)
  rfc: '',                                // opcional: si lo llenas aparece en "Información de la empresa"
  email: 'contacto.vibemarket@gmail.com', // ← CAMBIA por el correo oficial (Gmail)
  phone: '+52 914 113 1112',              // teléfono visible
  phoneE164: '+529141131112',             // para el enlace tel:
  whatsapp: '529141131112',               // formato wa.me (código de país + número, sin + ni espacios)
  hours: 'Lunes a sábado, 9:00 a 20:00 h',
  location: 'Envíos a todo México · atención 100% en línea',
  founded: 2026,
};
/** Enlaces de contacto listos para usar */
const CONTACT = {
  gmail: (subject = 'Contacto desde VibeMarket', body = '') =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(COMPANY.email)}&su=${encodeURIComponent(subject)}${body ? '&body=' + encodeURIComponent(body) : ''}`,
  mailto: (subject = 'Contacto desde VibeMarket') => `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}`,
  whatsapp: (text = 'Hola VibeMarket, tengo una pregunta') => `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`,
  tel: () => `tel:${COMPANY.phoneE164}`,
};

/* Las 32 entidades federativas de México (orden alfabético) */
const MX_STATES = ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];

/** Estado según los 2 primeros dígitos del C.P. (rangos de SEPOMEX). Devuelve '' si no se reconoce. */
function stateFromCP(cp) {
  const n = parseInt(String(cp).slice(0, 2), 10); if (isNaN(n) || String(cp).length < 2) return '';
  const R = [[1, 16, 'Ciudad de México'], [20, 20, 'Aguascalientes'], [21, 22, 'Baja California'], [23, 23, 'Baja California Sur'], [24, 24, 'Campeche'], [25, 27, 'Coahuila'], [28, 28, 'Colima'], [29, 30, 'Chiapas'], [31, 33, 'Chihuahua'], [34, 35, 'Durango'], [36, 38, 'Guanajuato'], [39, 41, 'Guerrero'], [42, 43, 'Hidalgo'], [44, 49, 'Jalisco'], [50, 57, 'Estado de México'], [58, 61, 'Michoacán'], [62, 62, 'Morelos'], [63, 63, 'Nayarit'], [64, 67, 'Nuevo León'], [68, 71, 'Oaxaca'], [72, 75, 'Puebla'], [76, 76, 'Querétaro'], [77, 77, 'Quintana Roo'], [78, 79, 'San Luis Potosí'], [80, 82, 'Sinaloa'], [83, 85, 'Sonora'], [86, 86, 'Tabasco'], [87, 89, 'Tamaulipas'], [90, 90, 'Tlaxcala'], [91, 96, 'Veracruz'], [97, 97, 'Yucatán'], [98, 99, 'Zacatecas']];
  const r = R.find(([a, b]) => n >= a && n <= b); return r ? r[2] : '';
}
/** <option>s de estados para cualquier <select> */
const stateOptions = (selected = '') => '<option value="">Selecciona tu estado…</option>' + MX_STATES.map(s => `<option ${s === selected ? 'selected' : ''}>${s}</option>`).join('');
