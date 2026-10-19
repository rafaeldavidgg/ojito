# Design

## Context

Ver `proposal.md` (Why). Estado actual: `src/preview.js` solo acepta `property="og:image"` via regex (`pickMeta`/`pickImage`); `src/app.js:16-32` enriquece en background sin bloquear y marca `preview_status`; `public/app.js:70-93` muestra `<img referrerpolicy="no-referrer">` o "Sin preview" y Editar usa `prompt()` solo para titulo/nota aunque `PATCH /api/ojitos/:id` y la columna `image_url` ya soportan imagen. Restricciones: todo gratis (sin unfurl externo), sin subidas (solo URL), sin migracion de BD, mismos limites de fetch (6s, 500KB, 3 redirects, SSRF).

## Goals / Non-Goals

**Goals:**
- Subir el acierto automatico en tiendas sin anti-bot usando fuentes ya presentes en el HTML.
- Convertir "Sin preview" en una llamada a la accion clara y comoda en movil para pegar la URL de imagen, con preview antes de guardar.
- No anadir dependencias, cuota, almacenamiento ni migraciones.

**Non-Goals:**
- Precio/alertas, screenshots/headless, servicios unfurl, subida de bytes (`multipart`, blobs, disco), Share Target PWA, cambios de auth/listas.

## Decisions

- **Orden de fuentes en `pickImage` (primera valida gana):** `og:image` -> `og:image:secure_url` -> `twitter:image` (`property` o `name`) -> `<link rel="image_src">` -> JSON-LD (`"image"` string / array / `{url}`) -> primera `<img src>` >=400px o con clase product/main. Alternativa descartada: parser HTML completo (cheerio/jsdom) — dependencia y peso innecesarios para un best-effort.
- **Normalizacion comun:** resolver relativas contra URL final, `slice(0,2000)`, aceptar solo `http(s)`, rechazar `data:`/`blob:`. Reutiliza el guard SSRF existente para el fetch; para la URL manual se valida formato + `https?` sin fetchearla en servidor (la prueba es el `<img>` del cliente).
- **Sin tocar API/BD:** `POST` creacion y `POST retry-preview` usan el parser ampliado; el guardado manual reutiliza `PATCH image_url` existente. Alternativa descartada: endpoint `/upload` — implicaba storage en Render/Turso con perdidas y costes, prohibido por el alcance.
- **UX movil (cumple `responsive-ui`):** cuando `preview_status='unavailable'` y no hay `image_url`, la tarjeta muestra aviso + campo `URL de la imagen` (`inputmode=url`, `placeholder https://...`, min-height 48px) + boton Pegar (>=44px) + ayuda de una linea ("En la tienda: manten la foto -> Copiar enlace de imagen -> Pegalo aqui") + preview `<img loading=lazy referrerpolicy=no-referrer>` al pegar. `Editar` pasa de `prompt()` a hoja con campos titulo/nota/imagen reutilizando el mismo validador cliente. Se mantienen tokens calidos y `escapeAttr`/`escapeHtml` existentes contra XSS.
- **Tests sin red:** fixtures HTML locales por fuente (og, twitter, secure_url, image_src, JSON-LD string/array/objeto, img fallback, 403/HTML Cloudflare) + tests de validacion de URL manual. No se toca el test de "preview bloqueada no impide guardar".

## Risks / Trade-offs

- [Hotlink con URL firmada que caduca] -> Mitigacion: ayuda honesta ("si la tienda caduca el enlace la foto puede caer; vuelve a pegarla") y no sobreescribir `image_url` puesta a mano en reintentos automaticos.
- [Anti-hotlink (403 solo al cargar `<img>`)] -> Mitigacion: `referrerpolicy="no-referrer"` ya existente; si falla, la preview cliente lo muestra antes de guardar y el usuario puede probar otra URL.
- [Regex fragil ante atributo `content` antes de `property`, comillas simples, mayusculas] -> Mitigacion: regex tolerante a orden/caso en `pickMeta` + tests por variante.
- [Falso positivo en fallback `<img>` (logo, sprite)] -> Mitigacion: ultimo recurso, umbral de tamano/clase y nunca pisa imagen manual existente.
- [XSS via `image_url` con `javascript:`] -> Mitigacion: validador `https?` en cliente y servidor (el `PATCH` ya trocea a 2000; anadir rechazo de esquema no-http).

## Migration Plan

Sin migracion. Despliegue = codigo estatico + `src/preview.js`. Rollback = revert del change; las `image_url` manuales ya guardadas se conservan (columna sin cambios).

## Open Questions

- Ninguna que cambie specs o tareas. Detalle menor diferible a implementacion: texto exacto de la ayuda en la tarjeta (ES corto vs con ejemplo por tienda).
