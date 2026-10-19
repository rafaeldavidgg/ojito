# Tasks

## 1. Preparación herramienta y baseline

- [x] 1.1 Instalar `impeccable` con `npx impeccable install --providers=opencode` y verificar con `npx impeccable --help` que el CLI responde; si falla, leer su README vía webfetch y dejar constancia del fallback manual.
- [x] 1.2 Capturar baseline visual actual (fotos o medidas a 375/768/1024/1440 + `npm test`) y verificar que `npm test` pasa antes de tocar `public/`.

## 2. Base layout mobile-first

- [x] 2.1 Reescribir base en `public/styles.css` (body 16px, `main` con `clamp()` y max-width, `.top` sticky con `safe-area-inset`, `box-sizing` y `overflow-x` controlado) y verificar a 360px que no hay scroll horizontal en auth, listas y detalle.
- [x] 2.2 Implementar breakpoints progresivos (`columns: 1` base ≤480px, 2 cols ≥700px, 3 cols ≥1100px; `.lists-head`/`.inline-form`/`.detail-head` en columna en base y fila ≥640px) y verificar en 375/768/1024/1440 que nada se solapa ni recorta.
- [x] 2.3 Ajuste mínimo en `public/index.html` (landmarks, labels asociados, atributos `alt`/`loading` coherentes, sin cambiar IDs usados por `app.js`) y verificar con `npm test` que no hay regresión funcional.

## 3. Componentes táctiles y consistencia visual

- [x] 3.1 Normalizar `.btn`/`.chip`/`.linklike`/acciones de `.tile` a `min-height: 44px`, espaciado ≥8px y wrap, y verificar midiendo targets en DevTools móvil que todos son ≥44px sin apiñamiento.
- [x] 3.2 Consolidar tarjetas, panel auth, chips y badges con tokens existentes (`--paper/--ink/--accent/--blush`, radio 18px, serif editorial) eliminando anti-patrones (Inter-only, degradado morado-azul, cards-in-cards, gris-sobre-color, bounce, brillos, emoji-iconos) y verificar por revisión visual que la identidad cálida se mantiene en las 3 vistas.

## 4. Accesibilidad y rendimiento móvil

- [x] 4.1 Corregir contraste a ≥4.5:1 en texto/muted/links y endurecer `prefers-reduced-motion`, y verificar con medidor de contraste y emulación de movimiento reducido que no quedan animaciones esenciales.
- [x] 4.2 Optimizar media y fuentes (`loading=lazy` + `srcset`/`sizes` best-effort en `public/app.js`, máx. 2 familias con `display=swap`, sin hero pesado) y verificar en throttling móvil que imágenes cargan diferidas y no bloquean render.

## 5. Gate visual e integración

- [x] 5.1 Ejecutar `impeccable polish` y luego `impeccable audit` (o `bolder` si el resultado parece plantilla genérica) y verificar que el audit pasa o que los hallazgos restantes quedan registrados como aceptados.
- [x] 5.2 Verificación integral: recorrer auth → crear lista → guardar ojito → filtrar pendiente/comprado en 375/768/1024/1440 + `npm test`, y verificar cero scroll horizontal, acciones ≥44px y sin regresiones de `saved-items`/`wish-lists`.

## Workflow follow-up

- Archivar el cambio tras revisión del usuario (`openspec archive`).
- Verificar el resultado archivado.
