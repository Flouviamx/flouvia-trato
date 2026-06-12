# Trato — CLAUDE.md

SaaS de cotizaciones B2B standalone de Flouvia. Dominio: **trato.flouvia.com**.
Es la versión independiente de la app de Shopify "Flouvia Cotizaciones B2B"
(repo hermano: `../flouvia/src/data/apps.ts`), dirigida a **cualquier negocio B2B
en México** — no solo Shopify.

> **Repo:** `~/Desktop/flouvia-trato` (carpeta HERMANA de `~/Desktop/flouvia`, NO
> anidada — son dos repos git y dos proyectos Vercel independientes).
> GitHub: `github.com/Flouviamx/flouvia-trato`. Deploy automático en Vercel a
> `trato.flouvia.com` con cada push a `main`.

---

## Comandos

```bash
npm run dev      # localhost:4321
npm run build    # build de producción
npm run preview  # preview del build
```

Node requerido: **>=22.12.0** (ver `.nvmrc` → 22.13.0)

---

## Stack (idéntico a flouvia-web)

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 6.1.2 (`output: 'server'`) + `@astrojs/vercel` |
| Auth | Clerk (`@clerk/astro`) — **signup ABIERTO** (no invitation-only como el portal de flouvia) |
| DB | **Neon (PostgreSQL serverless)** — schema en `db/schema.sql`. Decisión jun 2026: Neon en vez de Supabase. Crear vía Vercel Marketplace → integración Neon (auto-provisiona `DATABASE_URL`). |
| Billing | Stripe Billing (freemium) |
| Emails | Resend (transaccionales: cotización vista, aprobada, etc.) |
| CFDI | PAC de timbrado (mismo proveedor que la app de Shopify) |
| Animaciones | GSAP 3 — **solo en landing/login**; dentro de la app, CSS animations |
| Tipografía | **Inter única** (las serif se ELIMINARON jun 2026 a petición de André) — montos con clase `.editorial` = Inter 600, tracking −0.03em, `tabular-nums` |

✅ **Clerk YA está ACTIVO** (jun 2026): integración en `astro.config.mjs` con
`localization: esMX` (`@clerk/localizations`), keys de development en `.env`,
middleware en `src/middleware.ts`, componentes `<SignIn/>`/`<SignUp/>` montados
en `/login` y `/registro` (SSR, `prerender = false`). App de Clerk: "Trato"
(`app_3Ey07ttoq6VjvVgWmPOnI0U9rW6`), login CLI como flouvia.mx@gmail.com
(`clerk` CLI instalado en `~/.npm-global/bin/clerk`). Falta: instancia de
producción + proteger `/app` con auth. **Aún NO hay Neon/Stripe** (jun 2026);
la app corre con datos mock desde `src/lib/mock.ts` — mismo shape que el schema,
para que el swap a Neon sea cambiar imports por queries.

---

## Estado actual (jun 2026)

✅ Esqueleto Astro + tokens de diseño
✅ **Landing de ventas completa** (estilo Stripe/Linear con ADN Flouvia) — desplegada
✅ **Logos reales** en `public/imgs/`: `logo-trato-navy.png` (fondos claros) y `logo-trato-white.png` (fondos oscuros) — recortados a 780×300
✅ **App demo completa con datos mock** — dashboard, cotizaciones (lista + editor interactivo + detalle), clientes, productos, ajustes, link público `/q/{token}`
✅ **Clerk conectado** — `/login` y `/registro` con componentes reales (es-MX); falta proteger `/app`
⬜ Conectar Neon (DATABASE_URL) + Stripe — siguiente fase

---

## Modelo de negocio

Freemium tipo la app de Shopify: gratis hasta 5 cotizaciones activas con
"Powered by Trato" en el link público; planes de pago vía Stripe Billing.
Precios actuales en la landing (MXN/mes, IVA incluido):

| Plan | Precio | Incluye |
|------|--------|---------|
| Gratis | $0 | 5 cotizaciones activas, catálogo, link público + PDF, marca "Powered by Trato" |
| Profesional | $590 MXN/mes | Cotizaciones ilimitadas, tu marca, seguimiento en vivo, Net 30/60, pago en línea |
| Negocio | $1,190 MXN/mes | + CFDI 4.0 automático, clientes con límite de crédito, analítica, soporte prioritario |

> ⚠️ Precios son placeholders comerciales — André los puede ajustar. Si cambian,
> actualizar `src/components/landing/Pricing.astro`.

Moneda v1 = MXN con IVA 16% configurable. Landing + app en el MISMO subdominio
(estilo linear.app: marketing en `/`, app en `/app`).

---

## Multi-tenant

PK de relación = **`org_id`** (NO `email_cliente` como el portal de flouvia-web).
Cada negocio registrado es una `org`; v1 = 1 usuario Clerk por org
(`orgs.clerk_user_id`; multi-usuario en fase 2 con Clerk Organizations).

**Tablas** (`db/schema.sql`):
- `orgs` — el negocio (nombre, logo, datos fiscales/RFC/CSD, `quote_prefix`, plan, Stripe IDs)
- `productos` — catálogo de cada org
- `clientes` — a quién se cotiza (con `terminos_default` y `limite_credito`)
- `cotizaciones` — status `draft|sent|viewed|approved|rejected|expired|paid|invoiced` + `public_token` (para `/q/{token}`)
- `cotizacion_items` — líneas (permite línea libre sin producto; `precio_negociado` opcional)
- `eventos` — timeline + "tu cliente vio la cotización" (**feature estrella**)
- `facturas_cfdi` — timbrado SAT (fase 4)

Patrón RLS: `org_id = current_setting('app.org_id', TRUE)::uuid` — el backend setea
el valor antes de cada query (igual que `app.email_cliente` en flouvia-web).

---

## Mapa de rutas

```
# Landing (prerender:true) — CONSTRUIDA
/                → landing de ventas (un solo index.astro que monta los componentes)

# App — CONSTRUIDA con datos mock (src/lib/mock.ts); usa AppLayout.astro
/login /registro → placeholder borderless (botón entra a /app); Clerk los reemplaza después
/app             → dashboard: KPIs con count-up vanilla, pipeline por estado,
                   recientes, activity feed
/app/cotizaciones        → tabla con filtros por estado (client-side)
/app/cotizaciones/nueva  → EL EDITOR (interactivo: agregar del catálogo, precio
                           negociado por línea con highlight verde, totales+IVA en
                           vivo, chips de términos, toast). Script is:inline con
                           define:vars={{ catalogo }}
/app/cotizaciones/[id]   → detalle + timeline + acciones (link público, PDF, CFDI)
/app/clientes /app/productos → directorios (CRUD visual; import CSV después)
/app/ajustes     → marca, datos fiscales/CSD, plan
/q/[token]       → vista PÚBLICA de la cotización (la página mejor diseñada —
                   marca del emisor, total `.editorial` protagonista, aprobar → success,
                   pie "vía trato" = loop viral). Token mock: /q/demo

# Legales (pendiente)
/privacidad /terminos
```

**Mock data:** `src/lib/mock.ts` exporta `ORG`, `PRODUCTOS`, `CLIENTES`,
`COTIZACIONES` (con items + eventos), `STATUS_META` (label/color/bg por estado),
helpers de dinero (`money`, `quoteTotal`…) y `findQuote`/`findQuoteByToken`.
La org demo es "Materiales del Valle" (construcción) — coherente con el mockup
del hero (COT-0148 → El Zarco). Al conectar Neon: reemplazar imports por queries.

**AppLayout (`src/layouts/AppLayout.astro`):** sidebar navy sticky (logo blanco,
nav con íconos, card de org abajo), topbar con título + badge "DEMO" + slot
`topbar-actions`, content max-width 1240px. Entradas con CSS `app-fadein`
escalonado (NO GSAP — la app no carga GSAP). Mobile: sidebar → tab bar inferior
fija. Clases globales reutilizables: `.card`, `.status-pill`, `.editorial`.

---

## Landing — estructura (YA CONSTRUIDA)

`src/pages/index.astro` monta los componentes de `src/components/landing/` y maneja
las animaciones GSAP globales. Orden de secciones:

| Componente | Sección | Notas |
|-----------|---------|-------|
| `Nav.astro` | Navbar | Replica el sistema de flouvia (ver abajo) |
| `Hero.astro` | Hero | Gradient mesh + mockup de la app + trust strip |
| `Features.astro` | Producto (`#producto`) | Bento grid con mini-mockups |
| `Steps.astro` | Cómo funciona (`#como`) | 3 pasos sobre fondo navy |
| `ClientView.astro` | Experiencia del cliente | Mockup de teléfono del link público `/q/` |
| `Pricing.astro` | Precios (`#precios`) | 3 planes, el de en medio destacado en navy |
| `Faq.astro` | FAQ (`#faq`) | Acordeón nativo `<details>` |
| `Footer.astro` | CTA final + footer | Navy, enlaza a flouvia.com |

**Filosofía visual (jun 2026):** referencias = **Stripe + Linear**, alma = **Flouvia**.
Minimalista, lujoso, mucho aire. Secciones con `padding: 9rem` vertical. Tipografía
grande (hero H1 `clamp(2.7rem, 6.2vw, 5rem)`). Gradient mesh sutil monocromático
navy (NO los colores saturados de Stripe). Glows suaves estilo Linear bajo los
mockups. **El mockup del producto es la pieza que vende** — cada uno es HTML/CSS puro
con montos en `.editorial` (Inter 600 tabular). El mockup del hero AUTO-REPRODUCE
la historia del producto en loop (ver "Hero story" abajo).

### Navbar (`Nav.astro`) — replica el sistema de flouvia-web

Es el mismo patrón que `../flouvia/src/components/Navbar.astro`, adaptado:
- **Top-bar** oscuro editorial: "PLATAFORMA DE COTIZACIONES B2B · UN PRODUCTO DE FLOUVIA · HECHO EN MÉXICO".
- **Glass pill** (izquierda) Liquid Glass con los nav-links + **indicador deslizante**
  (`#nav-indicator`, cápsula de vidrio que GSAP desliza al link en hover, estilo
  segmented control iOS).
- **Megamenú (jun 2026):** "PRODUCTO" (`data-mega`) expande la píldora EN VERTICAL —
  la fila de links queda arriba (`.pill-row`) y abajo se revela `#pill-mega` (grid
  2×3 de features con ícono+título+desc + footer "cómo funciona"). Cerrado colapsa
  `width:0; height:0` (para no ensanchar la píldora); GSAP anima width/height de la
  píldora al abrir/cerrar (mide `offsetWidth` antes/después), items con stagger
  fade+blur, `border-radius 100px → 24px` vía clase `.mega-open` (transición CSS).
  Abre con hover/click, cierra con mouseleave, otros links, scroll y Escape. Tiene
  variantes de color para `.scrolled` (píldora navy).
- **Logo central** `logo-trato-navy.png` (30px alto) que **desaparece al hacer
  scroll** y reaparece como `pill-logo` (`logo-trato-white.png`, 17px) dentro de la
  glass pill navy (misma mecánica que el logo de flouvia). En mobile: dos `<img>`
  apiladas (navy/white) que se intercambian por opacity con `.scrolled`.
- **Derecha:** "Entrar" + botón navy "Empezar gratis".
- **Estado `.scrolled`** (>50px): la glass pill pasa a versión navy translúcida; los
  links y wordmark cambian a blanco. Transición por-propiedad `0.7s var(--ease-spring)`.
- **Mobile:** píldora glass con hamburguesa + wordmark + CTA; overlay con `clip-path:
  circle()` que abre desde la esquina superior derecha; links en Inter 700 con
  stagger blur (sin megamenú en mobile).
- **Anti-flash:** gate `.js-anim #navbar { opacity:0 }` (is:global) + entrada GSAP que
  oculta las piezas, revela el contenedor y las entra con stagger. `clearProps` al
  terminar para que `.scrolled`/`:hover` gobiernen.
- Diferencias vs flouvia: SIN lang switch (v1 solo español), SIN login-icon pill
  (usa "Entrar" en texto), wordmark de texto en vez de logos SVG.

### Animaciones de la landing (`index.astro`) — refinadas jun 2026 (Stripe/Linear)

> El usuario RECHAZÓ: botones magnéticos, ripple de click y tilt 3D con el cursor
> ("lo típico"). No reintroducirlos. El lenguaje actual es sutil y craft:

- **Masked line reveals (Linear):** los títulos (`.hero-title, .ft-title,
  .steps-title, .cv-title, .pr-title, .faq-title, .fc-title`) se parten por `<br>`
  en líneas envueltas en `.m-line` (overflow hidden) + `.m-line-in`; cada línea sube
  con `yPercent: 115 → 0`, `power3.out`, stagger 0.09–0.11. El util `wrapLines` los
  procesa al cargar; esos títulos quedan EXCLUIDOS del reveal genérico (`maskedSet`).
- **Mockup settle (Stripe):** el mockup del hero entra con `rotationX: 9` y
  perspectiva, y se APLANA con scrub conforme baja el scroll (`top 88%` → `top 32%`).
- **Hero story (jun 2026):** el mockup del hero narra el loop del producto:
  badge `#mkStatus` cicla Enviada (azul) → Vista (ámbar) → Aprobada (verde) con
  pop, el toast `#mkToast` aparece en "Vista", los eventos `[data-story]` del
  timeline se encienden en orden y el chip `#mkChip` (CFDI timbrado) entra al
  aprobar; loop infinito con fade de cierre. El HTML por defecto es el estado
  FINAL (Aprobada) → sin JS/reduced-motion queda estático y completo.
- **Micro-demos bento (jun 2026):** en `.ev-edit` el precio baja en vivo
  (191.48 → 168.50) con flash verde y el chip −12% hace pop; el check del CFDI
  entra con pop. ScrollTrigger `once:true`.
- **Demo del teléfono (ClientView):** auto-reproducible al entrar en viewport —
  count-up del monto, items en stagger, cursor SVG que se desliza y "clickea"
  Aprobar (anillo verde de pulso), checkmark que se dibuja (strokeDashoffset),
  overlay de éxito; loop con repeatDelay 3.4s.
- **Count-up** de números (`[data-countup]` + `data-decimals`) al entrar en
  viewport — formato `Intl.NumberFormat('es-MX')`.
- **Parallax scrub** en watermarks (steps/footer) y hero-mesh.
- **Reveals genéricos** (`.reveal`): patrón anti-parpadeo — `gsap.set` oculta +
  `ScrollTrigger {once:true, onEnter: gsap.to}` con `clearProps: 'transform'`
  (NUNCA limpiar opacity — el gate lo volvería a ocultar; bug conocido).
- Gate global `.js-anim .reveal/.reveal-mockup { opacity:0 }`; estilos `.m-line`
  en `<style is:global>`.
- `prefers-reduced-motion` → return temprano, todo visible y estático.
- El navbar maneja su PROPIA entrada (no la toca `index.astro`).

---

## Fases de construcción

1. **Núcleo** — Clerk + schema + CRUDs + editor de cotizaciones + dashboard
2. **Loop completo** — link público `/q/{token}` + tracking `viewed` + PDF + emails (Resend)
3. **Dinero** — Stripe Billing (límites del free) + pago en línea de cotizaciones
4. **CFDI + cierre** — timbrado (mismo PAC que la app de Shopify), pulir landing,
   listar Trato en `apps.ts` y footer de flouvia.com

---

## Diseño — sistema Flouvia adaptado a producto

Regla de oro: **misma alma, distinto cuerpo**. Tokens en `src/layouts/Layout.astro`
(`:root` global). Referencias visuales: **Stripe, Linear, Apple, Aesop**.

**Tokens disponibles:**
```css
--color-bg: #ffffff;  --color-bg-soft: #fcfcfc;  --color-blue-deep: #0a192f;
--color-text: #050505;  --color-text-muted: #555556;  --color-border: rgba(0,0,0,0.08);
--color-ok: #10b981;     /* aprobada / pagada */
--color-warn: #f59e0b;   /* pendiente / por vencer */
--color-danger: #ef4444; /* vencida / rechazada */
--font-sans: 'Inter';   /* --font-serif ELIMINADO jun 2026 — Inter única */
--ease-ios / --ease-spring / --ease-smooth   /* mismos que flouvia */
```

**Reglas tipográficas:**
- **TODO en Inter** — André pidió ELIMINAR las serif (jun 2026). NO reintroducir
  Instrument Serif ni itálicas decorativas. La carga de Google Fonts es solo Inter
  (weights 400–900).
- **Montos y números** → clase `.editorial` (definida global en ambos layouts):
  Inter weight 600, `letter-spacing: -0.03em`, `font-variant-numeric: tabular-nums`.
  Es la firma "fintech" del producto (estilo Stripe). Nunca serif, nunca italic.
- **Headings 100% Inter bold** — sin palabra-acento.
- Eyebrows: `0.65rem`, weight 800, letter-spacing 3px, uppercase, color `#888`.
- **Logos oficiales** (`public/imgs/`): `logo-trato-navy.png` para fondos claros,
  `logo-trato-white.png` para fondos oscuros (sidebar de la app, footer, pill
  scrolled, mockups). Recortados a 780×300. NO recrear el wordmark con texto.

**Layout / componentes:**
- Secciones de la landing: `padding: 9rem` vertical (mucho aire, estilo Stripe/Linear).
- Watermarks gigantes en **Inter 800, letter-spacing −0.06em** (`rgba(0,0,0,0.025)`
  claro / `rgba(255,255,255,0.025)` oscuro) **solo en landing/login** — dentro de la
  app NO (es herramienta, no editorial).
- Liquid Glass (blur + rim light + specular) en: navbar, topbar de la app y segmented
  controls de filtros. Patrón exacto en `Nav.astro` y en el navbar de flouvia-web.
- Sección oscura: `radial-gradient(ellipse at 20% 50%, #112240 0%, #0a192f 65%, #050b14 100%)`.
- Cards: border-radius 22–24px, sombras luxe. NO borders blancos en fondo oscuro —
  usar box-shadow profundo + `inset 0 0 0 0.5px rgba(255,255,255,0.06)`.
- Mockups: navy `#0a192f`, sombras muy profundas (`0 50px 100px -36px`), glow radial
  debajo (`.mockup-glow` / `.cv-glow`).

**Hovers:** `translateY(-2 a -4px)` + sombra, transiciones 0.4–0.6s, `--ease-spring`.
Sin scale dramático (max 1.03). Sin magnetic, sin back.out, sin elastic.

**Animación:** estándar único — `power2.out`, fade + `y:14–18`, stagger 0.08, gate
`.js-anim`. `expo.out`/`power3.out` solo para scrub o la entrada del navbar. SOLO en
landing/login. Dentro de la app: CSS animations simples (patrón portal de flouvia).
Sin SplitText, sin blur/scale en reveals de contenido.

**Bugs conocidos (heredados de flouvia, aplican igual):**
- Anti-FOUC: gate `.js-anim` (script is:inline en `<head>` del Layout, ya puesto).
- Anti-parpadeo de reveals: `gsap.set` oculta + `ScrollTrigger{once,onEnter:gsap.to}` —
  nunca `gsap.from`+`immediateRender:false`.
- `clearProps:'transform,opacity'` tras el reveal para liberar hovers.
- `overflow: clip` (no `hidden`) para no romper `position: sticky`.
- Estilos de DOM inyectado en runtime (Clerk, librerías) → `<style is:global>` porque
  Astro scopea con `[data-astro-cid]` y el DOM inyectado no lo lleva.
- `Clerk.signOut(cb)` necesita callback para no auto-navegar.

---

## Variables de entorno

Ver `.env.example`. Los proyectos de Neon, Clerk y Stripe son NUEVOS y separados
de los de flouvia.com:

```
DATABASE_URL=                                                   # Neon (PostgreSQL)
PUBLIC_CLERK_PUBLISHABLE_KEY=  CLERK_SECRET_KEY=                # signup ABIERTO
STRIPE_SECRET_KEY=  STRIPE_WEBHOOK_SECRET=  PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
PAC_API_KEY=                                                    # timbrado CFDI
```

Neon se recomienda provisionar vía **Vercel Marketplace → Neon** desde el proyecto
de Vercel de trato (auto-inyecta `DATABASE_URL` en todos los environments).

---

## Deployment

- **Plataforma:** Vercel (proyecto independiente del de flouvia.com).
- **Dominio:** `trato.flouvia.com` (movido al proyecto de Trato en Vercel; DNS ya
  apunta a Vercel).
- **Modo:** SSR (`output: 'server'`). La landing es `prerender: true`.
- Todas las API routes futuras necesitan `export const prerender = false`.
