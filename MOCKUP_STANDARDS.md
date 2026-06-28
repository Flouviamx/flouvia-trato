# 💎 The Cord "Quiet Luxury" Mockup Standard (SOP)

**NIVEL DE EXIGENCIA: MASTERCLASS (STRIPE / LINEAR / APPLE / NOTION)**

Este documento es la **Constitución de Diseño** para la Inteligencia Artificial (Antigravity, Claude, etc.). Cada vez que se te pida crear un mockup UI en código (HTML/CSS/Tailwind) para la landing page, **DEBES** seguir estas reglas con precisión milimétrica. El objetivo no es "que se vea bien", el objetivo es que parezca diseñado por el equipo core de Stripe, Vercel o Linear.

---

## 🏛️ 1. FILOSOFÍA DE DISEÑO: "QUIET LUXURY"

Los mockups de clase mundial no gritan. Susurran. Se basan en:
1.  **Espacio Negativo (Aire):** Multiplica por 2 los paddings que usarías normalmente. Deja que los elementos y la tipografía respiren.
2.  **Contraste Tipográfico Quirúrgico:** Títulos masivos con tracking negativo (`tracking-tighter`, `letter-spacing: -0.04em`), subtítulos extremadamente sutiles en gris (`text-gray-500` o `text-gray-400`).
3.  **Profundidad Multicapa:** Nunca uses una sola sombra de Tailwind. Un elemento flotante premium tiene sombra de base, sombra de ambiente y un borde interior (*rim light*) que simula que la luz rebota en el cristal.
4.  **Cero Emojis, Cero Bordes Duros:** Prohibido usar emojis (❌ 🚀 👆). Usa SVGs finos con `stroke-width="1.5"`. Prohibido el `#000000` puro para bordes, usa `#0a192f` u opacidades suaves (ej. `border-black/5`).

---

## 🏗️ 2. ANATOMÍA DEL CONTENEDOR (El "Macbook Glassmorphism")

Todo mockup debe vivir dentro de un contenedor "Ventana". El usuario NUNCA debe ver un mockup pegado directamente al fondo de la web. Cópia exactamente esta estructura base:

### El Contenedor Supremo (Código Tailwind Exacto)
```html
<div class="relative w-full max-w-5xl mx-auto group perspective-1000">
  <!-- Glow Ambiental de fondo (Opcional, detrás del mockup para dar profundidad) -->
  <div class="absolute -inset-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-[100px] rounded-[3rem] opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>

  <!-- Ventana Principal -->
  <div class="relative overflow-hidden rounded-[2rem] bg-white/70 backdrop-blur-3xl 
              border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02),_0_30px_60px_-15px_rgba(0,0,0,0.12)] 
              ring-1 ring-black/[0.03] transform transition-transform duration-700 ease-out">
    
    <!-- Efecto "Rim Light" (Reflejo de luz superior en el borde del cristal) -->
    <div class="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,1)] pointer-events-none z-10"></div>

    <!-- Topbar estilo macOS (Sutil, monocromático, sin los colores fuertes del semáforo) -->
    <div class="flex items-center px-5 py-4 border-b border-gray-900/5 bg-white/40">
      <div class="flex space-x-2">
        <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
        <div class="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
      </div>
      <!-- Searchbar Falso / Breadcrumb sutil -->
      <div class="mx-auto w-1/3 h-6 bg-gray-900/5 rounded-md flex items-center justify-center">
         <span class="text-[10px] text-gray-400 font-medium font-mono">cord.flouvia.com/app</span>
      </div>
    </div>

    <!-- Contenido de la UI (El Mockup real) -->
    <div class="p-8 md:p-12 relative bg-gray-50/30">
      <!-- ... -->
    </div>
  </div>
</div>
```

---

## 🎨 3. TRADUCCIÓN DE CÓDIGO REAL A "CALCA PREMIUM" (La Abstracción)

Cuando extraigas código de la app de Cord, **DESTROZA LA LÓGICA**. El mockup es puramente teatro visual.

### A. Datos Falsos Exquisitos
- **Nombres B2B reales y sobrios:** `Acme Corp.`, `Global Logistics Ltd.`, `Constructora Apex`.
- **Números que impacten:** `$12,450.00 MXN`, `$1.2M USD` (Asegúrate de añadir la clase `tabular-nums` o `.editorial` de Cord a todos los números para que se alineen perfecto).
- **Badges de Estado Perfectos:** Usa píldoras (`rounded-full`) con fondos translucidos (`bg-emerald-50`) y textos contrastantes (`text-emerald-700`).

### B. "Skeleton Loaders" para evitar el ruido cognitivo
Si la interfaz real es muy compleja (ej. una tabla de 10 columnas y 20 filas), el mockup debe ser una obra de arte minimalista:
1. **Reduce drásticamente:** Muestra solo 2 o 3 filas clave y máximo 4 columnas.
2. **Usa Skeletons Elegantes:** En lugar de textos descriptivos largos que nadie leerá, inyecta barras grises estéticas:
```html
<!-- Texto falso convertido a diseño abstracto -->
<div class="space-y-2.5">
  <div class="h-2 w-3/4 bg-gray-200/60 rounded-full"></div>
  <div class="h-2 w-1/2 bg-gray-200/60 rounded-full"></div>
</div>
```

### C. Estilos Premium en Componentes Base
- **Inputs Falsos:** `bg-[#f5f5f7] border-0 rounded-xl px-4 py-3 text-sm text-gray-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]`.
- **Botones Primarios (CTAs):** Deben ser magnéticos. `rounded-full bg-[#050505] text-white px-6 py-2.5 text-sm font-medium shadow-[0_4px_14px_rgba(0,0,0,0.15)] transform transition-transform hover:scale-105 active:scale-95`.

---

## 🪄 4. MICRO-INTERACCIONES Y ELEMENTOS FLOTANTES (El "Wow Factor")

Un mockup estático está muerto. Todo mockup generado por la IA **DEBE INCLUIR** capas superpuestas narrativas (`position: absolute; z-index: 50`) que cuenten una historia de uso real.

### Capa Mágica 1: El Cursor Fantasma (Notion style)
Coloca un cursor de ratón falso que flota sobre la interfaz, a punto de hacer clic en el CTA más importante.
```html
<div class="absolute top-[40%] right-[30%] z-50 animate-[float_4s_ease-in-out_infinite]">
  <!-- Cursor SVG (Sólido negro con drop-shadow) -->
  <svg class="w-6 h-6 text-black drop-shadow-md transform -rotate-12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.7z"/>
  </svg>
  
  <!-- Tooltip narrativo pegado al cursor -->
  <div class="absolute top-6 left-4 bg-black/95 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-2xl backdrop-blur-md whitespace-nowrap border border-white/10">
    Aprobar Cotización
  </div>
</div>
```

### Capa Mágica 2: La Notificación "Pop" Flotante (Apple/Linear style)
Un "Toast" o notificación superpuesta que valida lo que hace tu aplicación, desbordándose sutilmente del contenedor principal (`-right-10`).
```html
<div class="absolute -right-8 bottom-12 z-40 bg-white/90 p-4 rounded-2xl 
            shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-white/60 
            flex items-center space-x-4 backdrop-blur-2xl
            animate-[float_5s_ease-in-out_infinite_reverse]">
  <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center ring-4 ring-blue-50/50">
    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
  </div>
  <div>
    <p class="text-sm font-semibold text-gray-900 tracking-tight">Análisis Completado</p>
    <p class="text-[11px] text-gray-500 font-medium">Margen optimizado en un +14%</p>
  </div>
</div>
```

---

## 🚫 5. LO QUE LA IA NUNCA DEBE HACER (Reglas de Sangre)

1. **PROHIBIDO COMPONENTES REALES:** Nunca importes `<form>`, `useState`, hooks, llamadas a BD, ni nada interactivo real en el mockup de la landing. Rompes el build y asfixias el performance.
2. **PROHIBIDO EL `shadow-lg` NATIVO:** Es barato. Las sombras deben ser compuestas, largas y suaves (usa las fórmulas escritas arriba).
3. **PROHIBIDAS LAS CAJAS ENCAJONADAS:** Huye de los Bento grids de bordes duros (`border-gray-200` grueso por todos lados). Usa divisores *hairline* finísimos o separa mediante `gap` y aire.
4. **PROHIBIDO OVERFLOW SUCIO:** Si creas un bloque con `overflow-y-auto`, ES OBLIGATORIO ocultar la asquerosa barra de scroll nativa usando `[&::-webkit-scrollbar]:hidden`.

---

## 🏢 6. LOGOS DE MARCAS E INTEGRACIONES (El estándar de alta resolución)

Nunca uses emojis para representar marcas (❌ "Stripe 💳", "WhatsApp 💬"). Nunca uses PNGs feos o SVGs estáticos que engorden el bundle. Cuando necesites mostrar un logotipo real de una marca (ej. integraciones, logos de clientes, herramientas de software), **DEBES** utilizar el truco de la API no documentada de Google Favicon V2 para obtener logos de alta calidad dinámicamente usando solo el dominio.

### El Snippet Obligatorio:
```html
<img 
  src="https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://DOMINIO_DE_LA_MARCA.com&size=128" 
  alt="Nombre de la Marca" 
  class="w-6 h-6 rounded-md shadow-sm" 
  loading="lazy" 
/>
```
*Sustituye `DOMINIO_DE_LA_MARCA.com` por el dominio real (ej. `stripe.com`, `zapier.com`, `hubspot.com`).* Este método garantiza iconos nítidos (128x128px) en un formato premium.

---

## 🤖 INSTRUCCIÓN DE EJECUCIÓN DIRECTA PARA LA IA (Tú)

Cuando el humano te pase el prompt pidiendo el mockup, tu flujo de pensamiento y código debe ser:
1. Extraer el alma del componente fuente.
2. Escribir un archivo estático (.astro o .tsx sin dependencias raras).
3. Escribir el **Contenedor Supremo** con *glassmorphism* y *rim lights*.
4. Redibujar la UI internamente, con datos exquisitos y *skeletons* para lo secundario.
5. Engancharle **capas mágicas flotantes** (Cursores o Popups con GSAP o CSS Keyframes puros).
6. Entregar un código que, al guardarlo, haga que el usuario se caiga de la silla por el nivel estético de la implementación.
