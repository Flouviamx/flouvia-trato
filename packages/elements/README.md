# @flouviahq/elements

Embebe el cotizador B2B de **[Cord](https://cord.flouvia.com)** en cualquier
sitio — con tu marca, aprobación, contraoferta y pago en línea, sin que tus
clientes salgan de su portal.

Es la versión **framework-native** del embed: en vez de pegar el `<script>` de
`embed.js` a mano, instalas el paquete y usas un componente. Por debajo es el
mismo `<iframe>` seguro a `cord.flouvia.com/embed/{token}` (auto-altura vía
`postMessage`, allowlist de dominios por cuenta).

```bash
npm install @flouviahq/elements
```

---

## Web Component (HTML, Vue, Svelte, Angular, Astro…)

Importar el paquete registra `<cord-cotizador>` automáticamente.

```js
import '@flouviahq/elements';
```

```html
<cord-cotizador token="abc123"></cord-cotizador>
```

Los eventos se emiten **nativos** (sin prefijo `cord:`):

```js
const el = document.querySelector('cord-cotizador');
el.addEventListener('approved', (e) => console.log('Aprobada', e.detail.folio));
el.addEventListener('pay', (e) => location.assign('/gracias'));
```

**Vue 3 (Native Component):**

```vue
<script setup>
import { CordCotizador } from '@flouviahq/elements/vue';

const onApproved = (e) => console.log('Aprobada', e.folio);
</script>

<template>
  <CordCotizador token="abc123" @approved="onApproved" />
</template>
```

> Nota: También puedes usar el Web Component estándar si no usas Vue 3, pero requerirá configurar `compilerOptions.isCustomElement`.

---

## Framer (No-Code)

Para usar Cord en Framer con controles visuales (Property Controls):

1. Crea un nuevo **Code Component** en Framer.
2. Pega este código:

```tsx
import { FramerCordCotizador } from '@flouviahq/elements/framer';
export default FramerCordCotizador;
```

3. Arrastra el componente a tu canvas. Aparecerá un campo "Token" en la barra lateral derecha para que ingreses tu token fácilmente.

---

## Webflow (No-Code)

Integración automática para Webflow sin escribir código JS manual:

1. Añade un **Div Block** donde quieras que aparezca el cotizador.
2. En los ajustes del elemento (Settings), añade un **Custom Attribute**:
   - Name: `data-cord-token`
   - Value: `tu_token_aqui`
3. Ve a los **Site Settings > Custom Code** (o Page Settings) y pega este script en el `<head>`:

```html
<script src="https://unpkg.com/@flouviahq/elements/dist/webflow.js"></script>
```

El script buscará automáticamente todos los divs con `data-cord-token` e inyectará el cotizador.

---

## React / Next.js

```tsx
import { CordCotizador } from '@flouviahq/elements/react';

export default function Cotizacion() {
  return (
    <CordCotizador
      token="abc123"
      onApproved={(d) => console.log('Aprobada', d.folio)}
      onPay={() => router.push('/gracias')}
    />
  );
}
```

En Next.js (App Router) márcalo como Client Component (`'use client'`).

---

## Vanilla / control manual

```js
import { mountCotizador } from '@flouviahq/elements';

const controller = mountCotizador(document.getElementById('box'), {
  token: 'abc123',
  onApproved: (d) => console.log(d),
});

// más tarde…
controller.destroy();
```

---

## API

### `<cord-cotizador>` — atributos

| Atributo     | Tipo   | Default                      | Descripción |
|--------------|--------|------------------------------|-------------|
| `token`      | string | —  (requerido)               | Token público de la cotización |
| `base-url`   | string | `https://cord.flouvia.com`  | Origen de Cord (self-host / staging) |
| `min-height` | number | `420`                        | Alto del skeleton mientras carga |

### Props de `<CordCotizador>` (React)

`token` (req), `baseUrl`, `minHeight`, `className`, `style`, y los callbacks
`onReady`, `onApproved`, `onRejected`, `onMessage`, `onPay`, `onEvent`.

### `mountCotizador(el, options) → { destroy(), el }`

`options`: `token` (req), `baseUrl`, `minHeight`, y los mismos callbacks.

### Eventos

| Evento (React / WC)         | Cuándo |
|-----------------------------|--------|
| `onReady` / `ready`         | el cotizador cargó |
| `onApproved` / `approved`   | el cliente aprobó · `detail: { token, folio }` |
| `onRejected` / `rejected`   | el cliente rechazó |
| `onMessage` / `message`     | comentario o contraoferta |
| `onPay` / `pay`             | inició el pago en línea |
| `onEvent` / —               | catch-all (recibe el `type` y el `detail`) |

---

## Seguridad

El cotizador solo se puede embeber en los **dominios autorizados** de tu cuenta
(Ajustes › Developers › Cotizador embebible). Cord lo aplica con el header CSP
`frame-ancestors` — anti-clickjacking. El `token` es la credencial: no expone tu
cuenta, solo esa cotización.

---

Hecho por [Flouvia](https://flouvia.com) · México 🇲🇽
