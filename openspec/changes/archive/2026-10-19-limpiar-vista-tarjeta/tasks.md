# Tasks

## 1. Quitar edicion inline de la tarjeta

- [x] 1.1 Eliminar el bloque `imgform` del render de tarjeta en `public/app.js` (campo, Pegar/Guardar, ayuda y preview inline), la llamada a `wireImgForm` y la funcion entera, dejando el aviso corto que dirige a Editar, y verificar con grep que `imgform`, `wireImgForm`, `imginput` e `imgrow` devuelven cero resultados en `public/app.js`.
- [x] 1.2 Eliminar los estilos `.imgform`/`.imgrow` huerfanos en `public/styles.css` conservando los de la hoja de Editar (`.sheet`, `.imgpreview`, `.hint`), y verificar con grep cero resultados de `.imgform`/`.imgrow` y que `node --check public/app.js` no da errores.
- [x] 1.3 Verificar el resultado sirviendo la app: tarjeta sin preview muestra solo el aviso + acciones (comprado, Editar, reintentar, eliminar), la hoja de Editar sigue permitiendo pegar URL de imagen con preview y guardado, y `npm test` queda en verde.
