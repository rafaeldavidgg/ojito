# Design

## Context

Ver `proposal.md - Why`: CSS actual desktop-down (`public/styles.css` 68 líneas) con `columns: 2` fijo hasta 420px, `.lists-head` e `.inline-form` sin apilado real, y botones `.small`/`.linklike` <44px. Estructura en `public/index.html` (header `.top`, `main#app`, vistas `authView`/`mainView`, masonry `#grid`) y render en `public/app.js`. Restricciones: sin cambios de API (`src/*.js` intacto), PWA y SQLite intactos, viewport `width=device-width` ya presente. Fuente de herramientas: `https://github.com/stars/rafaeldavidgg/lists/design` (revisada 2026-10-19: impeccable, awesome-design-md, ui-ux-pro-max-skill, diagram-design).

## Goals / Non-Goals

**Goals:**
- Reescribir `styles.css` mobile-first (base 360–375px → 768/1024/1440) cumpliendo `specs/responsive-ui/spec.md`.
- Cerrar checks visuales en 375/768/1024/1440 + contraste 4.5:1 + `prefers-reduced-motion`.
- Dejar puerta de calidad repetible con `impeccable audit` / `polish`.

**Non-Goals:**
- No cambiar API, auth, previews, modelo de datos ni flujos de listas/ojitos.
- No introducir framework CSS, nuevo brand ni modo oscuro en este cambio.
- No diagramas publicables (no aplica `diagram-design`).

## Decisions

- **Herramienta: `impeccable` (`init` → `craft`/`shape` → `polish` → `audit`) como gate.**
  Rationale: es el flujo de calidad + build de la lista design y trae 61 detectores para cazar anti-patrones y roturas responsive. Alternativas descartadas: `ui-ux-pro-max-skill` (generador de design-system de 192 reglas — sobredimensionado, Ojito ya tiene tokens cálidos y serif editorial que se conservan); `awesome-design-md/DESIGN.md` como referencia (no se adopta un brand externo, solo se consulta si la dirección visual queda sosa tras `bolder`); `diagram-design` (sin diagramas en este cambio).
- **Conservar tokens y tipografía, no rebrand.**
  Rationale: `--paper #faf5ec / --ink / --accent #b3274a / --blush`, radio 18px y serif (Iowan/Palatino/Georgia) ya dan identidad cálida no-genérica. Alternativa (nueva paleta + Inter) descartada por regla anti-slop y coste innecesario.
- **CSS mobile-first con custom properties + `min-width` progresivo; masonry 1 col base.**
  Base: 1 columna ≤480px (`columns: 1`), 2 cols ≥700px, 3 cols ≥1100px; `main` con `padding-inline: clamp()` y `max-width: 1080px`; `.top` sticky con `safe-area`; `.inline-form` y `.lists-head` en columna en base, fila solo ≥640px. Alternativa (Grid con container queries) descartada: soporte y simplicidad — columns ya usado, basta corregirlo.
- **Táctil por defecto: botones y chips ≥44px.**
  `.btn`, `.chip`, `.linklike` pasan a `min-height: 44px` con padding generoso; acciones de tarjeta envuelven. Alternativa (mantener `.small` 13px) descartada: incumple spec táctil.
- **Media ligera sin cambiar backend.**
  `loading="lazy"` ya existe; añadir `srcset`/`sizes` donde haya URL de imagen, `display=swap` y límite a 2 familias. Alternativa (hero/video) no existe en Ojito — no se introduce.

## Risks / Trade-offs

- [Risk] `impeccable` no instalado en la máquina → Mitigación: tarea `npx impeccable install --providers=opencode` + fallback a lectura de su README vía webfetch y checks manuales 375/768/1024/1440.
- [Risk] Imágenes externas sin dimensiones rompen masonry → Mitigación: `aspect-ratio: 4/3` + `object-fit: cover` ya existen, mantener + `srcset` best-effort.
- [Risk] Toque de `index.html`/`app.js` introduce regresión funcional → Mitigación: cambios de markup mínimos y aditivos (clases, aria), tests `npm test` tras cada bloque.
- [Trade-off] 1 columna en móvil muestra menos items por pantalla a cambio de legibilidad y cero scroll horizontal — se acepta por regla mobile-first.

## Migration Plan

1. Solo frontend: desplegar `public/` estático; sin migraciones ni cambios de API.
2. Validar `npm test` + revisión visual 375/768/1024/1440 + `impeccable audit`.
3. Rollback: revertir `public/styles.css` (+ `index.html` si se tocó); sin estado que migrar.

## Open Questions

- Ninguna que bloquee specs o tareas. Detalle menor a confirmar en apply: si el usuario quiere `DESIGN.md` de referencia (de `getdesign.md`) cuando `polish` pida dirección más fuerte — no cambia requisitos.
