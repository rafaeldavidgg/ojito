# Tasks

## 1. Streaming con corte temprano + UA + entidades (server)

- [x] 1.1 Reescribir la descarga en `src/preview.js` a lectura por tramos con corte al conseguir titulo+imagen y ventana maxima de busqueda, manteniendo timeout/SSRF/redirects, y verificar con fixture local de HTML de ~1.2MB con metas al inicio que devuelve imagen sin descargar todo.
- [x] 1.2 Cambiar el user-agent a Chrome actual y decodificar entidades HTML en `pickTitle`, y verificar que el HTML real de Primor devuelve imagen y titulo legible y que `npm test` sigue en verde.
- [x] 1.3 Persistir el motivo del fallo junto al estado en `enrichAsync` y `retry-preview` (columna `preview_reason` con migracion compatible SQLite/Turso, default NULL, sin backfill), y verificar guardando una URL que falla y leyendo el motivo en BD.

## 2. Verificacion integral

- [x] 2.1 Probar de extremo a extremo contra la ficha real de Primor del usuario y contra una pagina ligera con metas, y verificar que ambas prerrellenan imagen y que un 403 deja motivo `http-403` sin tumbar el guardado, con `npm test` en verde.
