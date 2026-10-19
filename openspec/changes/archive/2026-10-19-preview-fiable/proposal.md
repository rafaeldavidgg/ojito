# Proposal

## Why

Las fichas de producto de tiendas pesadas (p. ej. Primor/Magento, ~1.2MB de HTML) nunca muestran imagen automatica: el fetch descarga la pagina entera y la descarta por superar el tope de 500KB, aunque el `og:image` viva en los primeros 50KB. Ademas, cuando falla no se guarda el motivo y el user-agent `OjitoBot` cierra puertas (El Corte Ingles responde 403 al bot y 200 con `og:image` a un UA de navegador).

## What Changes

- El fetch de preview lee el HTML por tramos y corta en cuanto tiene titulo + imagen, con una ventana maxima de busqueda en lugar del tope de pagina completa. Sin dependencias nuevas; mismos guards (timeout 6s, SSRF, 3 redirects).
- Se conserva el motivo del fallo (`too-large`, `http-403`, `timeout`...) junto al estado para poder diagnosticar.
- El titulo decodifica entidades HTML (`B&#xE1;lsamo` → `Bálsamo`).
- El fetch usa un user-agent de navegador actual en vez de `OjitoBot/1.0`.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `saved-items`: el enriquecimiento best-effort encuentra la imagen en paginas pesadas sin descargarlas enteras, expone el motivo del fallo y presenta titulos legibles (requisito "Enriquecimiento best-effort no bloqueante").

## Impact

- Afectado: `src/preview.js` (lectura por tramos + corte temprano, UA, entidades), `src/app.js` (persistir motivo), `test/ojito.test.js` (fixtures pesadas locales, sin red).
- No afecta: esquema salvo posible columna/campo para el motivo (decidir en design), API publica, frontend, despliegue.
- Nota honesta: no salta protecciones serias (Cloudflare de Lush/VS, paginas 100% JS como Zara). El motivo guardado dira en prod que casos son esos.
