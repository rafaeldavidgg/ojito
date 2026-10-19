# Tasks

## 1. Parser gratuito ampliado (server)

- [x] 1.1 Ampliar `pickImage` en `src/preview.js` a orden `og:image` -> `og:image:secure_url` -> `twitter:image` (`property`/`name`) -> `<link rel="image_src">` -> JSON-LD `image` -> fallback `<img>` grande, con regex tolerante a orden/caso de atributos y resolucion de relativas, y verificar con fixtures HTML locales que cada fuente devuelve la URL esperada sin hacer red.
- [x] 1.2 Endurecer `pickMeta`/validacion de imagen (solo `http(s)`, rechazar `data:`/`blob:`/`javascript:`, tope 2000) manteniendo limites actuales (timeout, tamano, redirects, SSRF), y verificar con `npm test` y casos de esquema invalido rechazados.
- [x] 1.3 Evitar que el reintento automatico pise `image_url` puesta a mano cuando el fetch vuelve a fallar, y verificar guardando imagen manual, forzando `retry-preview` con 403 y comprobando que la imagen manual se conserva.

## 2. URL de imagen manual explicita en movil (PWA)

- [x] 2.1 Mostrar en la tarjeta sin preview (`preview_status='unavailable'` sin `image_url`) el aviso de accion + campo "URL de la imagen" (`inputmode=url`) + boton Pegar + ayuda de una linea para copiar desde la tienda, y verificar a 360px que no hay scroll horizontal y los targets son >=44px.
- [x] 2.2 Anadir vista previa instantanea en cliente al pegar (con `<img loading=lazy referrerpolicy=no-referrer>`) y validacion de formato `https?` con mensaje claro sin borrar la imagen previa, y verificar pegando URL valida (muestra foto), invalida (error visible) y vacia (no rompe).
- [x] 2.3 Sustituir el `prompt()` de Editar por hoja con titulo/nota/URL-imagen que reutiliza el mismo validador y llama al `PATCH` existente, manteniendo `escapeHtml/escapeAttr` y tokens/estilos actuales, y verificar editando cada campo en movil y escritorio y comprobando persistencia tras recargar.

## 3. Integracion y documentacion

- [x] 3.1 Cubrir el flujo completo con tests: guardado con parser ampliado (fixture local), `retry-preview` con 403 conserva imagen manual, y `PATCH image_url` rechaza esquema no-http, y verificar con `npm test` en verde.
- [x] 3.2 Actualizar ayuda visible/README (`Previews`: como pegar la imagen desde el movil y limite honesto del hotlink con URLs firmadas), y verificar que el texto documentado coincide con la UI implementada.
