/* =========================================================
   VibeMarket — build para Vercel (y para desarrollo local)
   - Lee SUPABASE_URL y SUPABASE_ANON_KEY de las variables de entorno
     (en Vercel: Settings › Environment Variables; en local: archivo .env)
   - Genera assets/js/env.js con esos valores (son públicos: la seguridad
     la dan las políticas RLS de Supabase).
   - "npm run build": copia el sitio a dist/ (lo que publica Vercel).
   - "npm run env":   solo genera assets/js/env.js para probar en tu computadora.
   ========================================================= */
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envOnly = process.argv.includes('--env-only');

// 1) Variables: primero .env (local), luego las del sistema (Vercel) tienen prioridad
const vars = {};
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
for (const k of ['SUPABASE_URL', 'SUPABASE_ANON_KEY']) if (process.env[k]) vars[k] = process.env[k];

const url = (vars.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const key = (vars.SUPABASE_ANON_KEY || '').trim();
if (!url || !key) {
  console.warn('\n⚠️  Faltan SUPABASE_URL y/o SUPABASE_ANON_KEY. La página funcionará en MODO LOCAL (datos en el navegador).\n');
} else if (!/^https:\/\/.+\.supabase\.co$/.test(url)) {
  console.warn(`\n⚠️  SUPABASE_URL no parece una URL de Supabase: ${url}\n`);
}
const envJs = `/* Generado automáticamente por scripts/build.mjs — no editar a mano */
window.VM_ENV = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }, null, 2)};
`;

if (envOnly) {
  writeFileSync(join(root, 'assets/js/env.js'), envJs);
  console.log(`✅ assets/js/env.js generado (${url ? 'modo Supabase: ' + url : 'modo local'})`);
  process.exit(0);
}

// 2) Copiar el sitio a dist/
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const f of readdirSync(root)) if (f.endsWith('.html')) cpSync(join(root, f), join(dist, f));
cpSync(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
writeFileSync(join(dist, 'assets/js/env.js'), envJs);
console.log(`✅ Build listo en dist/ (${url ? 'modo Supabase: ' + url : 'modo local'})`);
