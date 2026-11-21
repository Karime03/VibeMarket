# VibeMarket 🌿

Marketplace B2C de **marcas emergentes mexicanas** con tres pantallas (comprador, vendedor y administrador).

- **Front-end:** HTML5 semántico, CSS y JavaScript sin frameworks.
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage) con seguridad por filas (RLS).
- **Despliegue:** Vercel.
- **Pagos:** simulados. Es un proyecto académico: no se procesan cargos reales, pero cada pedido se valida y se registra en la base de datos.

> 📘 **Guía paso a paso para desplegar:** [`docs/DEPLOY.md`](docs/DEPLOY.md)

## Cómo correrlo

| Modo | Comando | Datos |
|---|---|---|
| **Con Supabase** (recomendado) | Copia `.env.example` → `.env`, pon tus llaves y ejecuta `npm run dev` | En tu proyecto de Supabase |
| **Local** (sin configurar nada) | `npx -y serve .` o `python -m http.server 3000` | En el navegador (localStorage) |

Abre `http://localhost:3000`. En la consola (F12) verás `[VibeMarket] Modo de datos: Supabase` o `local`.

## Estructura

```
vibemarket/
├── index.html · catalog.html · product.html · cart.html · checkout.html · account.html · support.html
├── login.html            Selección de rol + inicio de sesión + registro
├── vendor.html           Panel del VENDEDOR
├── admin.html            Panel del ADMINISTRADOR
├── assets/
│   ├── css/styles.css    Sistema de diseño (variables, componentes, responsive)
│   ├── img/              Logotipo y favicon (SVG)
│   └── js/
│       ├── env.js        ← Generado por "npm run env"/Vercel (URL y llave pública de Supabase)
│       ├── config.js     Categorías, colores, cupones, envío y DATOS DE LA EMPRESA (COMPANY)
│       ├── api.js        CAPA DE DATOS: Supabase (Auth, tablas, RPC, Storage) o modo local
│       ├── app.js        Interfaz común: header, footer, carrito, favoritos, buscador, chatbot
│       ├── images.js     Ilustraciones cuando una marca aún no sube fotos
│       ├── pricing.js    Cotización de envío, cupones y totales
│       ├── panel.js      Estructura de los paneles (menú lateral, gráficas, tablas)
│       └── home · catalog · product · cart · checkout · account · support · login · vendor · admin .js
├── supabase/schema.sql   Esquema completo: tablas, RLS, funciones, triggers y Storage
├── scripts/build.mjs     Build para Vercel (genera env.js y la carpeta dist/)
├── vercel.json           Configuración de Vercel (build, salida, rutas y cabeceras de seguridad)
├── package.json          Scripts: dev · env · build · preview
├── .env.example          Plantilla de variables de entorno
├── serve.json            Configuración para "npx serve" (no borrar)
└── docs/                 DEPLOY.md (guía) · ARQUITECTURA.md
```

## Checklist de evaluación (secciones del proyecto)

| # | Sección | Requisito | Dónde verlo |
|---|---|---|---|
| 1 | **Inicio** | Destacados y ofertas · Categorías · Testimonios y garantías · Newsletter | `index.html` |
| 2 | **Catálogo** | Categorías y subcategorías · Filtros (precio, marca, características, color, calificación) · Orden (precio, popularidad, novedad, descuento) · Cuadrícula o lista · Búsqueda con autocompletar | `catalog.html`, buscador en el encabezado |
| 3 | **Producto** | Galería con zoom (fotos de hasta 1600 px) · Descripción y especificaciones · Reseñas verificadas · Relacionados y "también compraron" · Variantes de talla y color · Stock por variante | `product.html?id=…` |
| 4 | **Carrito** | Detalle · Cantidades · Envío por C.P. · Cupones · Carritos guardados (en la cuenta) | `cart.html` |
| 5 | **Checkout** | Una sola página · Invitado · Resumen · Políticas visibles · **Pago simulado** (tarjeta, PayPal, Mercado Pago, OXXO) | `checkout.html` |
| 6 | **Mi cuenta** | Pedidos · Rastreo con historial real · Favoritos · Datos y direcciones · Preferencias · Devoluciones · Mis reseñas | `account.html` |
| 7 | **Atención** | Chatbot y WhatsApp · FAQ con buscador · Formulario de contacto (llega a la bandeja del admin) · Políticas · Información de la empresa | `support.html` |
| — | **Vendedor** | Alta/edición de productos (CRUD) con fotos · Inventario · Pedidos con guía · Ganancias y comisión · Responder reseñas | `vendor.html` |
| — | **Administrador** | KPIs · Aprobar marcas y productos · Comisiones · Compradores · Pedidos · Devoluciones · Reseñas · Mensajes | `admin.html` |

**Contacto de la empresa:**
- **WhatsApp:** `+52 914 113 1112`, con enlace directo a `https://wa.me/529141131112`.
- **Correo:** con enlace a Gmail (`mail.google.com/?view=cm…`) y `mailto:`.
- **Dónde aparecen:** pie de página, Ayuda › Contacto, Ayuda › Información de la empresa, chat y seguimiento de pedidos.
- **Para cambiarlos:** edita `COMPANY` en `assets/js/config.js`.

## Seguridad (resumen)

- Contraseñas y sesiones con **Supabase Auth**: nunca se guardan contraseñas en la página.
- **RLS por rol:**
  - El público solo ve productos aprobados.
  - El vendedor solo edita los suyos y no puede autopublicarlos ni cambiar su comisión.
  - El comprador solo ve sus pedidos.
  - El administrador ve todo.
- **Los precios, el stock y los cupones se validan en el servidor** (`place_order`). Cambiar un precio desde el navegador no tiene efecto.
- Las fotos se suben a la carpeta de cada marca en Storage.
- La llave en `env.js` es la **pública** (anon/publishable). La `service_role` nunca se usa.

## Pago simulado: tarjetas de prueba

| Tarjeta | Resultado |
|---|---|
| `4242 4242 4242 4242` | ✅ Aprobada |
| `4000 0000 0000 0002` | ❌ Rechazada |
| `4000 0000 0000 9995` | ❌ Fondos insuficientes |

Cualquier fecha futura y CVC de 3 dígitos. Más casos en `docs/DEPLOY.md`.
