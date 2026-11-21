/* =========================================================
   VibeMarket — Ilustraciones SVG generadas (cuando una marca aún no sube fotos)
   ========================================================= */
/* ---------- Generador de imágenes SVG (placeholders elegantes) ---------- */
const BG_TONES = ['#EFE8DC', '#E6E0D4', '#ECE4DA', '#E3E6DE', '#F0E6DE'];

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function drawShape(shape, c) {
  const d = shade(c, -28), l = shade(c, 30);
  switch (shape) {
    case 'vase': return `<path d="M352 300 Q340 360 372 400 Q300 470 300 600 Q300 770 400 790 Q500 770 500 600 Q500 470 428 400 Q460 360 448 300 Z" fill="${c}"/><path d="M330 520 Q400 500 470 520 M318 580 Q400 560 482 580 M320 640 Q400 620 480 640" stroke="${d}" stroke-width="4" fill="none" opacity=".5"/><ellipse cx="400" cy="300" rx="48" ry="10" fill="${d}"/><path d="M372 400 Q330 450 316 520" stroke="${l}" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round"/>`;
    case 'shirt': return `<path d="M330 290 L250 330 L210 450 L270 470 L290 420 L290 780 L510 780 L510 420 L530 470 L590 450 L550 330 L470 290 Q400 340 330 290 Z" fill="${c}"/><path d="M330 290 Q400 340 470 290" stroke="${d}" stroke-width="5" fill="none"/><line x1="400" y1="320" x2="400" y2="780" stroke="${d}" stroke-width="2" opacity=".4"/><circle cx="400" cy="400" r="5" fill="${d}"/><circle cx="400" cy="480" r="5" fill="${d}"/><circle cx="400" cy="560" r="5" fill="${d}"/><rect x="430" y="400" width="50" height="45" rx="4" fill="none" stroke="${d}" stroke-width="2" opacity=".5"/>`;
    case 'bottle': return `<rect x="360" y="250" width="80" height="80" rx="12" fill="${shade(c,-60)}"/><rect x="378" y="320" width="44" height="50" fill="${d}"/><rect x="320" y="360" width="160" height="420" rx="40" fill="${c}" opacity=".92"/><rect x="345" y="500" width="110" height="160" rx="6" fill="#FAF7F2" opacity=".85"/><line x1="365" y1="545" x2="435" y2="545" stroke="${d}" stroke-width="3"/><line x1="375" y1="570" x2="425" y2="570" stroke="${d}" stroke-width="2" opacity=".6"/><rect x="335" y="380" width="14" height="300" rx="7" fill="#fff" opacity=".25"/>`;
    case 'candle': return `<path d="M400 360 Q385 395 400 420 Q415 395 400 360 Z" fill="#E8A15A"/><line x1="400" y1="420" x2="400" y2="450" stroke="#3A3B39" stroke-width="3"/><rect x="290" y="440" width="220" height="330" rx="28" fill="${c}" opacity=".9"/><ellipse cx="400" cy="450" rx="105" ry="16" fill="${l}"/><rect x="320" y="560" width="160" height="110" rx="4" fill="#FAF7F2" opacity=".9"/><text x="400" y="610" text-anchor="middle" font-family="Georgia" font-size="22" fill="${d}">copal</text><line x1="360" y1="635" x2="440" y2="635" stroke="${d}" stroke-width="1.5"/>`;
    case 'bag': return `<path d="M330 430 Q330 300 400 300 Q470 300 470 430" stroke="${d}" stroke-width="14" fill="none"/><path d="M270 430 L530 430 L550 790 L250 790 Z" fill="${c}"/><rect x="250" y="430" width="300" height="36" fill="${d}" opacity=".35"/><rect x="340" y="560" width="120" height="70" rx="4" fill="none" stroke="${l}" stroke-width="3" opacity=".7"/>`;
    case 'earrings': return `<circle cx="330" cy="360" r="14" fill="none" stroke="${d}" stroke-width="5"/><path d="M330 374 Q270 500 330 600 Q390 500 330 374 Z" fill="${c}"/><circle cx="470" cy="400" r="14" fill="none" stroke="${d}" stroke-width="5"/><path d="M470 414 Q410 540 470 640 Q530 540 470 414 Z" fill="${c}"/><circle cx="315" cy="510" r="8" fill="#fff" opacity=".5"/><circle cx="455" cy="550" r="8" fill="#fff" opacity=".5"/>`;
    case 'mug': return `<path d="M490 480 Q580 480 580 570 Q580 660 490 650" stroke="${c}" stroke-width="34" fill="none"/><rect x="250" y="420" width="250" height="330" rx="30" fill="${c}"/><ellipse cx="375" cy="425" rx="125" ry="20" fill="${d}"/><path d="M250 560 Q320 600 375 560 Q430 520 500 560" stroke="${l}" stroke-width="8" fill="none" opacity=".5"/>`;
    case 'notebook': return `<g transform="rotate(-6 400 540)"><rect x="270" y="300" width="270" height="400" rx="10" fill="${c}"/><rect x="270" y="300" width="22" height="400" fill="${d}"/><path d="M281 320 L281 680" stroke="#FAF7F2" stroke-width="3" stroke-dasharray="10 14"/><rect x="340" y="400" width="140" height="70" rx="4" fill="#FAF7F2" opacity=".9"/><rect x="490" y="300" width="14" height="400" fill="${shade(c,-50)}" opacity=".6"/></g>`;
    case 'plant': return `<ellipse cx="350" cy="380" rx="40" ry="110" fill="#5E7D5F" transform="rotate(-25 350 420)"/><ellipse cx="450" cy="370" rx="40" ry="120" fill="#6E8E6A" transform="rotate(22 450 420)"/><ellipse cx="400" cy="340" rx="34" ry="130" fill="#4F6E52"/><path d="M300 480 L500 480 L475 680 L325 680 Z" fill="${c}"/><rect x="290" y="470" width="220" height="30" rx="6" fill="${d}"/><line x1="345" y1="680" x2="335" y2="770" stroke="${d}" stroke-width="10"/><line x1="455" y1="680" x2="465" y2="770" stroke="${d}" stroke-width="10"/>`;
    case 'soap': return `<rect x="270" y="620" width="260" height="110" rx="34" fill="${shade(c,-20)}"/><rect x="290" y="520" width="220" height="110" rx="34" fill="${c}"/><rect x="310" y="430" width="180" height="100" rx="30" fill="${l}"/><text x="400" y="590" text-anchor="middle" font-family="Georgia" font-size="22" fill="${d}" opacity=".7">avena</text>`;
    case 'scarf': return `<path d="M260 320 Q400 280 540 320 L520 520 Q470 560 500 640 L420 780 Q380 700 330 720 L270 620 Q320 540 260 480 Z" fill="${c}"/><path d="M280 380 Q400 350 520 380 M290 450 Q400 420 510 450" stroke="${l}" stroke-width="6" fill="none" opacity=".5"/><circle cx="360" cy="520" r="26" fill="${d}" opacity=".35"/><circle cx="440" cy="590" r="18" fill="${l}" opacity=".45"/>`;
    case 'bowl': return `<ellipse cx="400" cy="500" rx="220" ry="40" fill="${d}"/><path d="M180 500 Q190 730 400 740 Q610 730 620 500 Z" fill="${c}"/><ellipse cx="400" cy="500" rx="200" ry="30" fill="${shade(c,-45)}" opacity=".6"/><path d="M220 560 Q300 640 400 650" stroke="${l}" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round"/>`;
    case 'necklace': return `<path d="M260 280 Q260 560 400 600 Q540 560 540 280" stroke="${d}" stroke-width="4" fill="none"/><path d="M400 600 m-46 0 a46 46 0 1 0 92 0 a34 34 0 1 1 -92 0 Z" fill="${c}"/><circle cx="380" cy="628" r="6" fill="#fff" opacity=".6"/>`;
    case 'print': return `<rect x="240" y="250" width="320" height="440" fill="#FAF7F2" stroke="${shade('#D9C8B0',-30)}" stroke-width="2"/><rect x="262" y="272" width="276" height="396" fill="${shade(c,120)}" opacity=".35"/><path d="M400 640 L400 380" stroke="${c}" stroke-width="5"/><ellipse cx="360" cy="460" rx="26" ry="60" fill="${c}" transform="rotate(-35 360 460)"/><ellipse cx="440" cy="420" rx="26" ry="60" fill="${c}" opacity=".8" transform="rotate(35 440 420)"/><ellipse cx="365" cy="560" rx="22" ry="50" fill="#B8643F" opacity=".7" transform="rotate(-40 365 560)"/><ellipse cx="435" cy="530" rx="22" ry="50" fill="#B8643F" opacity=".7" transform="rotate(40 435 530)"/><circle cx="400" cy="360" r="20" fill="#B8643F"/>`;
    case 'diffuser': return `<line x1="390" y1="480" x2="330" y2="240" stroke="#8A6E5A" stroke-width="5"/><line x1="400" y1="480" x2="405" y2="220" stroke="#8A6E5A" stroke-width="5"/><line x1="410" y1="480" x2="475" y2="250" stroke="#8A6E5A" stroke-width="5"/><line x1="395" y1="480" x2="365" y2="230" stroke="#8A6E5A" stroke-width="5"/><rect x="370" y="440" width="60" height="60" fill="${d}"/><path d="M370 500 Q290 540 290 640 Q290 770 400 775 Q510 770 510 640 Q510 540 430 500 Z" fill="${c}" opacity=".85"/><path d="M300 660 L500 660 Q505 770 400 775 Q295 770 300 660 Z" fill="${d}" opacity=".35"/>`;
    default: return `<circle cx="400" cy="520" r="160" fill="${c}"/>`;
  }
}

/**
 * Devuelve una data-URI SVG que representa el producto.
 * @param {object} p producto  @param {string} colorKey  @param {number} view 0..3 (ángulo de galería)
 */
function productImage(p, colorKey, view = 0) {
  if (p.images && p.images.length) return p.images[view % p.images.length]; // fotos subidas por la marca
  const ck = colorKey || p.colors[0];
  const hex = (C[ck] || C.arena).hex;
  const bg = BG_TONES[(p.id + view) % BG_TONES.length];
  const transforms = ['', 'translate(400 520) scale(1.45) translate(-400 -520)', 'translate(400 520) scale(.8) rotate(-8) translate(-400 -520)', 'translate(60 30) scale(.9)'];
  const deco = view === 3
    ? `<rect x="0" y="760" width="800" height="240" fill="${shade(bg,-14)}"/><circle cx="650" cy="230" r="70" fill="${shade(bg,10)}"/>`
    : `<circle cx="${view === 2 ? 620 : 180}" cy="${view === 2 ? 220 : 260}" r="${110 + view * 20}" fill="${shade(bg, 8)}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="${bg}"/>${deco}<ellipse cx="400" cy="795" rx="210" ry="22" fill="#1F2421" opacity=".08"/><g transform="${transforms[view]}">${drawShape(p.shape, hex)}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}


/** Ilustración decorativa por categoría (no depende de productos) */
const CATEGORY_ART = { moda: ['shirt', 'arena'], hogar: ['vase', 'terracota'], belleza: ['bottle', 'ambar'], joyeria: ['earrings', 'plata'], papeleria: ['print', 'bosque'] };
function illustration(shape, colorKey, view = 0, seed = 1) {
  return productImage({ id: seed, shape, colors: [colorKey] }, colorKey, view);
}
function categoryImage(catId) {
  const [shape, color] = CATEGORY_ART[catId] || ['vase', 'arena'];
  return illustration(shape, color, 3, catId.length);
}
