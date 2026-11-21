/* Ejemplo. El archivo real (env.js) lo genera "npm run env" desde .env,
   o Vercel durante el build. Sin env.js la página funciona en modo local. */
window.VM_ENV = {
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'tu-clave-anon-o-publishable',
};
