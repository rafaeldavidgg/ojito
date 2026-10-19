# Proposal

## Why

La UI actual de Ojito se diseñó desktop-down y sin requisitos mobile-first: el masonry fuerza 2 columnas hasta en 360px, los formularios inline y las cabeceras no apilan, y los touch targets quedan por debajo de 44px. Como la mayoría del tráfico es móvil, la experiencia en teléfono es estrecha, con scroll horizontal y acciones difíciles de pulsar.

## What Changes

- Reharder el CSS con enfoque mobile-first (base 360–375px, luego 768/1024/1440) sin cambiar la API ni la lógica de listas/ojitos.
- Corregir layout: apilado vertical en móvil, masonry a 1 columna en ≤480px, cabeceras y `inline-form` que envuelven, sin scroll horizontal a 360px.
- Normalizar interacción táctil y legibilidad: targets ≥44px, tipografía base ≥16px, espaciado ≥8px, contraste texto 4.5:1, respeto a `prefers-reduced-motion`.
- Consolidar sistema visual existente (tokens `--paper/--ink/--accent/--blush`, serif editorial + sans) y eliminar anti-patrones genéricos; optimizar imágenes con `srcset`/lazy y fuentes limitadas con `display=swap`.
- Añadir puerta de calidad visual con `impeccable audit` + `polish` y checks en 375/768/1024/1440.

## Capabilities

### New Capabilities

- `responsive-ui`: comportamiento responsive mobile-first y de estilo de toda la app (layout, breakpoints, táctil, contraste, movimiento reducido, gate visual con impeccable).

### Modified Capabilities

- Ninguna. `saved-items` y `wish-lists` no cambian requisitos de dominio; solo cambia su presentación.

## Impact

- Afectado: `public/styles.css` (reescritura principal), `public/index.html` (estructura semántica mínima, meta/viewport ya existe), `public/app.js` (clases/atributos menores si el markup cambia), `public/manifest.webmanifest` (theme-color si se retoca).
- No afectado: `src/*.js`, API REST, SQLite, auth, previews, PWA `sw.js`.
- Riesgo bajo, sin migraciones; cambio puramente frontend verificable por inspección visual y tests de layout.
