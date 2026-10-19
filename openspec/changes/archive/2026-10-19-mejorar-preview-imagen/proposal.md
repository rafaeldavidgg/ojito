# Proposal

## Why

Pegar enlaces de Victoria's Secret y Lush deja la ficha en "Sin preview — editalo a mano" sin imagen. El fetch de servidor devuelve 403 Cloudflare en ambos casos (verificado con UA OjitoBot y Chrome), asi que la imagen automatica es imposible ahi. El usuario quiere imagen garantizada con medios 100% gratuitos, sin servicios externos de cuota; el precio queda fuera de alcance.

## What Changes

- Ampliar el parser OpenGraph local (`src/preview.js`) para aceptar mas fuentes gratuitas ya presentes en el HTML: `twitter:image`, `og:image:secure_url`, `<link rel="image_src">`, JSON-LD `image` y, como ultimo recurso, primera `<img>` grande. Sin dependencias nuevas, mismos limites (timeout, tamano, SSRF).
- Hacer explicita y comoda la introduccion manual de la URL de imagen en movil cuando la preview automatica falla: campo visible "URL de la imagen" con boton Pegar, vista previa instantanea en cliente antes de guardar y ayuda contextual ("en la tienda manten la foto -> Copiar enlace de imagen -> Pegalo aqui").
- Mantener el flujo best-effort no bloqueante: el guardado nunca espera al fetch y `preview_status` sigue marcando `pending` / `ok` / `unavailable`.
- No cambia el modelo de datos (columna `image_url` y `PATCH` ya existen), no hay subidas de ficheros ni almacenamiento nuevo.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `saved-items`: el enriquecimiento best-effort acepta mas fuentes de imagen gratuitas y la edicion manual de imagen por URL se vuelve explicita y guiada en movil (requisitos "Enriquecimiento best-effort no bloqueante" y "Ver y editar detalle del ojito").

## Impact

- Afectado: `src/preview.js` (parser), `public/app.js` + `public/index.html`/`styles.css` (campo manual + preview cliente + copy), `test/ojito.test.js` (fixtures HTML locales, sin red).
- No afecta: esquema SQLite/Turso, auth, listas/memberships, limites de API, despliegue Render.
- Riesgo principal: hotlink con URLs firmadas que caducan (se documenta como limite honesto); anti-hotlink de algunas tiendas puede requerir `referrerpolicy` ya existente.
