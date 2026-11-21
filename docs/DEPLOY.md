# Guía de despliegue: Supabase + Vercel

Tiempo aproximado: 20–30 minutos. No necesitas instalar ninguna base de datos ni servidor.

> **Resumen:** creas el proyecto en Supabase y ejecutas `supabase/schema.sql`, subes la carpeta a GitHub, la importas en Vercel con 2 variables de entorno y creas el primer administrador desde la página.

---

## Paso 1 · Crear el proyecto en Supabase

1. Entra a <https://supabase.com> e inicia sesión (puedes usar tu cuenta de GitHub).
2. **New project**:
   - **Name:** `vibemarket`
   - **Database password:** genera una y guárdala.
   - **Region:** la más cercana, por ejemplo *East US (North Virginia)*.
3. Espera 1–2 minutos a que termine de crearse.

## Paso 2 · Crear las tablas, la seguridad y el almacenamiento de fotos

1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` de este proyecto, copia **todo** su contenido y pégalo.
3. Presiona **Run**. Debe terminar con *Success. No rows returned*.

Esto crea:

| Elemento | Detalle |
|---|---|
| Tablas | 16 tablas relacionales: perfiles, marcas, productos, pedidos, partidas, reseñas, devoluciones, favoritos, direcciones, carritos guardados, mensajes de contacto, newsletter, categorías y cupones |
| Seguridad (RLS) | Políticas por rol: cada usuario solo ve y edita lo que le corresponde |
| Funciones | `place_order()` registra el pedido y valida precios y stock en el servidor; también hay votos, newsletter y registro automático de perfiles |
| Almacenamiento | El bucket `product-images` para las fotos de productos |
| Configuración | Categorías y cupones. **Sin productos ni usuarios de prueba.** |

> El script se puede volver a ejecutar: borra y recrea las tablas de VibeMarket. Si lo corres de nuevo, también borra los usuarios en **Authentication → Users**.

## Paso 3 · Configurar el inicio de sesión (Auth)

1. **Authentication → Sign In / Providers → Email**:
   - Deja **Enable email provider** activado.
   - **Desactiva "Confirm email"** (recomendado para la evaluación). Así las cuentas se pueden usar en cuanto se crean. El servicio de correo integrado de Supabase tiene límites estrictos de envío, así que con la confirmación activada muchas personas no recibirían el correo.
2. **Authentication → URL Configuration** (lo completas en el paso 6, cuando tengas la URL de Vercel):
   - **Site URL:** `https://TU-PROYECTO.vercel.app`
   - **Redirect URLs:** agrega `https://TU-PROYECTO.vercel.app/**` y `http://localhost:3000/**`

## Paso 4 · Copiar las llaves del proyecto

**Project Settings → API Keys**. Copia dos valores:

- **Project URL:** algo como `https://abcdefghijk.supabase.co`. También aparece en *Project Settings → Data API*.
- **anon public key** (o **Publishable key**, en proyectos nuevos).

> Esta llave es **pública por diseño**: va en el navegador. La seguridad la dan las políticas RLS.
> **Nunca** uses la llave `service_role` ni una *Secret key* en este proyecto.

## Paso 5 · Probar en tu computadora (opcional, recomendado)

En la terminal de VS Code, dentro de la carpeta `vibemarket`:

```bash
# 1. Crea tu archivo .env a partir del ejemplo
copy .env.example .env          # Windows
# cp .env.example .env          # Mac / Linux
```

Abre `.env` y pega tus valores:

```
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...   (o sb_publishable_...)
```

```bash
# 2. Genera assets/js/env.js y arranca el servidor
npm run dev
```

Abre <http://localhost:3000>. Abre la consola del navegador (F12): debe decir `[VibeMarket] Modo de datos: Supabase (...)`.

> Si dice *modo local*, revisa el `.env` y vuelve a correr `npm run dev`.

## Paso 6 · Publicar en Vercel

1. **Sube el proyecto a GitHub.** Crea un repositorio y sube la carpeta `vibemarket`. El `.gitignore` ya excluye `.env` y `env.js`, así que tus llaves no se suben.
   - Opción fácil: en <https://github.com/new> crea el repositorio y usa *uploading an existing file* para arrastrar todo el contenido de la carpeta.
2. Entra a <https://vercel.com>, **Add New… → Project** y elige tu repositorio.
3. En la pantalla de configuración:
   - **Framework Preset:** `Other`. El `vercel.json` ya define todo: build `npm run build` y salida `dist`.
   - **Environment Variables:** agrega las dos:

     | Name | Value |
     |---|---|
     | `SUPABASE_URL` | `https://abcdefghijk.supabase.co` |
     | `SUPABASE_ANON_KEY` | tu llave anon / publishable |

4. **Deploy.** En 1 minuto tendrás una URL como `https://vibemarket-xxxx.vercel.app`.
5. Regresa a Supabase → **Authentication → URL Configuration** y pega esa URL (paso 3.2).

> Si cambias las variables después, en Vercel ve a **Deployments → ⋯ → Redeploy** para que se apliquen.

## Paso 7 · Primer uso (la tienda inicia vacía)

1. Abre tu URL → **Iniciar sesión → Administrador**. Aparece la **configuración inicial**: crea la cuenta principal. Solo el primer registro puede ser administrador; la base de datos lo impide después.
2. En otra ventana (o en modo incógnito): **Iniciar sesión → Vendedor → Crear cuenta**. Registra una marca.
3. Como administrador: **Vendedores → Aprobar**.
4. Como vendedor: **Subir producto**, con nombre, precio, fotos, variantes, stock y especificaciones.
5. Como administrador: **Productos → Aprobar**. El producto aparece en la tienda.
6. Como comprador (o invitado): compra con la tarjeta de prueba `4242 4242 4242 4242`.

---

## Tarjetas de prueba (pago simulado)

| Tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | ✅ Aprobada |
| `5555 5555 5555 4444` | ✅ Aprobada (Mastercard) |
| `4000 0000 0000 0002` | ❌ Rechazada por el banco |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |
| `4000 0000 0000 0069` | ❌ Tarjeta vencida |
| `4000 0000 0000 0127` | ❌ CVC incorrecto |

Cualquier fecha futura (`12/29`) y CVC de 3 dígitos (4 en American Express).

- **PayPal / Mercado Pago:** abren una ventana simulada para aprobar o cancelar.
- **OXXO:** genera una referencia. El administrador confirma el pago en **Pedidos → estado "Pagado"**.

---

## Archivos que tendrías que modificar

| Qué quieres cambiar | Archivo |
|---|---|
| Correo, teléfono, WhatsApp y horario de la empresa | `assets/js/config.js` → `COMPANY` |
| Textos legales (devoluciones, privacidad, términos) | `support.html`, sección `id="politicas"` |
| Categorías | `assets/js/config.js` → `CATEGORIES` **y** `supabase/schema.sql` (sección 8) |
| Cupones | `assets/js/config.js` → `COUPONS` **y** la tabla `coupons` en Supabase |
| Colores y tipografías | `assets/css/styles.css` → `:root` |
| Llaves de Supabase | `.env` (local) o *Environment Variables* en Vercel. Nunca en el código. |

## Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| La consola dice "modo local" en Vercel | Faltan las variables de entorno o no se hizo Redeploy |
| "Invalid API key" | Copiaste mal la llave o usaste la de otro proyecto |
| Al registrarse pide confirmar el correo | Desactiva "Confirm email" (paso 3) |
| "new row violates row-level security policy" | Es la seguridad funcionando: ese rol no tiene permiso para esa acción |
| Las fotos no suben | Vuelve a ejecutar `schema.sql` (crea el bucket `product-images` y sus políticas) |
| Un vendedor nuevo no ve su marca | Se crea automáticamente al registrarse; si ejecutaste `schema.sql` después de crear el usuario, bórralo en *Authentication → Users* y regístralo de nuevo |
