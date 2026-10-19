# Proposal

## Why

Ojito ya funciona en local (Node + Express + SQLite en fichero) pero no tiene URL publica para primeras pruebas. Con presupuesto 0E/mes, sin dominio y sin PC local siempre encendido, hace falta una via de despliegue gratuita donde el enlace no desaparezca y los datos persistan aunque el compute se duerma.

## What Changes

- Desplegar el mismo monolito Express (`src/server.js`, `src/app.js`, `public/`) en Render Free como web service con URL estable `*.onrender.com` + HTTPS.
- Mover la persistencia de `node:sqlite` en fichero (`OJITO_DB`, `src/db.js`) a Turso (libSQL, compatible SQLite) en su tier gratuito, para que los datos sobrevivan a sleeps y redeploys.
- Refactor sincrono -> asincrono en la capa DB (`db.prepare().get/all/run` -> `await client.execute()`), sin cambiar la API ni el comportamiento visible.
- Anadir `Dockerfile` minimo Node 22 + config de despliegue Render (`render.yaml` o deploy manual) y variables `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`, manteniendo fallback local (`OJITO_DB`) para dev y tests.
- Documentar despliegue y backup en `README.md`.

## Capabilities

### New Capabilities

Ninguna. Cambio de infraestructura y refactor interno sin cambio de comportamiento.

### Modified Capabilities

Ninguna. `wish-lists` y `saved-items` mantienen sus requirements y escenarios. La API (`/api/*`), validaciones, auth Bearer y previews best-effort no cambian.

Nota: change con cero deltas, requiere `skip_specs: true` en `.openspec.yaml` (validado: refactor + tooling, sin cambio de specs).

## Impact

- Afectado: `src/db.js`, `src/app.js` (todos los handlers y `canAccess`/`touchList`/`enrichAsync`), `src/auth.js` (register/login/auth), `src/server.js` (migrate async), `test/ojito.test.js` (mantener modo local), `package.json` (nueva dep `@libsql/client`), `README.md`, nuevos `Dockerfile` / `render.yaml`.
- APIs: sin cambios. Mismo contrato `POST /api/register`, `/api/login`, `/api/lists`, `/api/lists/:id/ojitos`, etc.
- Dependencias externas nuevas: Render Free (compute, 750h/mes, sleep 15min) y Turso Free (5GB, sin tarjeta). Sin dominio comprado.
- Riesgo principal: olvidar un `await` en auth/permisos rompe acceso; se mitiga con tests existentes + checklist en tasks.
