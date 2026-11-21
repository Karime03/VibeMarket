# Arquitectura de VibeMarket

```
Navegador (HTML + CSS + JS)
   │  assets/js/api.js  ←── única capa de datos
   │     ├─ supabase-js (CDN)
   ▼
Supabase
   ├─ Auth ............ registro / inicio de sesión (correo + contraseña)
   ├─ PostgreSQL ...... tablas + RLS + triggers + funciones (supabase/schema.sql)
   │     └─ place_order(): valida precios, stock y cupón; registra pedido + partidas; descuenta inventario
   └─ Storage ......... bucket "product-images" (carpeta por marca)
Vercel
   └─ hospeda el sitio estático; "npm run build" genera env.js desde las variables de entorno
```

## Flujo de datos

1. **Carga.** Cada página espera a `onReady()`. En modo Supabase, `api.js` carga en memoria lo que el usuario tiene permitido ver: productos y marcas públicas, y sus propios pedidos, favoritos y direcciones. Si el usuario es admin, carga todo.
2. **Escritura.** Cada cambio (`saveProduct`, `saveBrand`, `Orders.save`, `Reviews`, `Returns`, `Messages`) se compara con la última versión guardada. Solo se envían a Supabase las filas que cambiaron (insert, update o delete). Antes de navegar, `DB.flush()` espera a que terminen.
3. **Pedidos.** `Orders.place()` llama a la función `place_order` del servidor. El navegador no decide montos.
4. **Autenticación.** `Auth.login`, `Auth.register` y `Auth.changePassword` usan Supabase Auth. Al registrarse, un trigger crea el perfil, y la marca si es vendedor.

## Tablas

| Tabla | Contenido | Quién lee / escribe (RLS) |
|---|---|---|
| `profiles` | Rol, nombre, contacto, preferencias | Uno mismo · admin |
| `brands` / `brand_private` | Marca pública / RFC y CLABE | Público si está aprobada · dueño · admin |
| `categories`, `coupons` | Configuración | Lectura pública · admin |
| `products` | Catálogo con variantes, stock, specs y fotos | Público si está activo · marca dueña · admin |
| `orders` / `order_items` | Pedido y partidas | Comprador · marcas involucradas · admin |
| `reviews` / `review_votes` | Reseñas y votos "útil" | Público · autor · marca (solo responde) · admin |
| `returns` | Devoluciones | Comprador · marca · admin |
| `wishlists`, `addresses`, `saved_carts` | Datos del comprador | Solo el dueño |
| `contact_messages` | Formulario de contacto | Cualquiera envía · admin lee |
| `newsletter_subscribers` | Newsletter | Cualquiera se suscribe · admin lee |

## Servicios simulados (para producción real)

| Función | Hoy | En producción |
|---|---|---|
| Pagos | Validación simulada: Luhn, vencimiento, CVC, tarjetas de prueba, ventanas de PayPal y Mercado Pago, referencia OXXO | Stripe (Elements + Payment Intents + OXXO), PayPal, Mercado Pago, con un *Supabase Edge Function* para las llaves secretas |
| Envío | Tarifas por zona según el C.P. | API de Envia.com o Skydropx |
| Correos | Enlaces a Gmail | Resend o SendGrid |
| WhatsApp | Enlaces `wa.me` | WhatsApp Business Cloud API |
