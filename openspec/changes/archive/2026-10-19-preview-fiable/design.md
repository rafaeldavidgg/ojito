# Design

## Context

Ver `proposal.md` (Why). Estado actual: `src/preview.js:150-183` descarga el cuerpo entero con `arrayBuffer()` y lo descarta si supera 500KB (`too-large`); manda `OjitoBot/1.0`; el titulo no decodifica entidades; `src/app.js:16-32` tira el `reason` al marcar `unavailable`. Caso probado: ficha Primor de 1.24MB con `og:image` en el byte ~42 mil. Ver specs del change para los requisitos.

## Goals / Non-Goals

**Goals:**
- Encontrar titulo+imagen en paginas pesadas sin descargarlas enteras.
- Hacer diagnosticable cada fallo (motivo conservado).
- Titulos legibles y una puerta mas abierta (UA navegador).

**Non-Goals:**
- Saltar WAF serios, renderizar JS, descargar/procesar imagenes, cambios de API/BD salvo el motivo (ver Decisiones), frontend.

## Decisions

- **Lectura por tramos con corte temprano:** `response.body.getReader()`, acumular texto hasta una ventana de busqueda (~1MB) y tras cada tramo intentar `pickTitle`+`pickImage`; al conseguir ambos, `reader.cancel()` y usar eso. Alternativa descartada: subir el tope a 2MB — mas memoria/red por guardado y sigue arbitrario.
- **Motivo en la respuesta y en BD:** `fetchPreview` ya devuelve `reason`; `enrichAsync` y `retry-preview` lo persisten (columna nueva `preview_reason` o reutilizar campo; decidir en implementacion con migracion `IF NOT EXISTS` compatible Turso/SQLite). Sin exponerlo en la tarjeta de momento.
- **UA navegador actual:** `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36`. Verificado que El Corte Ingles pasa de 403 a 200+`og:image`. Práctica común; no evade Cloudflare/Turnstile.
- **Entidades:** decodificar `&#x..;`, `&#..;` y basicas (`&amp;`...) en `pickTitle` antes de truncar.
- **HTML cortado a mitad de etiqueta:** el regex de metas ya es tolerante; los tests incluyen corte en medio del `content`.

## Risks / Trade-offs

- [Stream sin cancelar deja conexiones colgadas] → Mitigacion: `cancel()` + `clearTimeout` en `finally`, test de no-cuelgue.
- [Metas mas alla de la ventana (raro)] → Mitigacion: ventana generosa; el motivo dira si fue `too-large` real.
- [Render puede seguir bloqueado por IP aunque aqui funcione] → Mitigacion: el motivo guardado lo revelara en prod; no prometer ECI/Primor en Render sin medir.
- [UA navegador vs transparencia] → Mitigacion: documentado en proposal; reversible en una linea.

## Migration Plan

Solo codigo + posible columna `preview_reason` con default NULL (sin backfill). Rollback = revert; la columna huerfana no rompe nada.

## Open Questions

- Ninguna que cambie specs o tareas.
