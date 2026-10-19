# Design

## Context

Estado actual (ver `src/`): monolito Express en un solo proceso. `src/server.js:4-9` abre `node:sqlite` via `src/db.js:4-10` (`OJITO_DB` o `./data.sqlite`), ejecuta `migrate()` sincrono y hace `app.listen(PORT)`. `src/app.js` usa `db.prepare(...).get/all/run` sincrono en ~25 sitios (`canAccess`, `touchList`, `enrichAsync`, handlers auth/listas/ojitos, `src/auth.js:3-34`). `public/` se sirve del mismo proceso. Sin `Dockerfile` ni config de despliegue.

Restricciones de la decision B: 0E/mes, sin tarjeta, sin PC local, sleep tolerado (~60s wake) pero datos y URL persistentes. Render Free solo da disco efimero, por eso la DB debe salir a Turso. Ver `proposal.md - Why`.

## Goals / Non-Goals

**Goals:**
- Misma API y comportamiento: ningun cambio en `wish-lists` / `saved-items`.
- Un solo servicio Render + una DB Turso, ambos en free tier, URL estable.
- Dev local y `npm test` siguen funcionando sin Turso (fallback fichero).

**Non-Goals:**
- No cambiar dialecto SQL ni esquema (Turso es SQLite, se reutiliza `migrate()`).
- No custom domain, no multi-region, no Litestream/R2, no Postgres.
- No mejoras PWA/offline ni compartir listas (v2).

## Decisions

**1. Render Free como compute (frente a Vercel/Netlify serverless).**
Mismo modelo de proceso largo: `app.listen` sigue valiendo, `enrichAsync` (`src/app.js:15-31`) sigue vivo tras responder, `express.static` sin separar frontend. Vercel obligaria a partir `src/app.js:33-219` en funciones, matar background y separar `public/`. Alternativa descartada por mayor cambio para el mismo 0E.

**2. Turso (libSQL) como persistencia (frente a Postgres Neon/Supabase).**
SQL casi identico: mismos `CREATE TABLE`, mismos `?`, mismo `strftime`. El cambio es sync -> async, no de dialecto. Postgres obligaria a reescribir tipos (`TEXT` ids), defaults y migraciones. Turso Free: 5GB, sin tarjeta, no pausa por inactividad como Postgres free. Alternativa descartada por alcance.

**3. Capa DB async minima con fallback dual.**
`src/db.js` expone `execute(sql, args)` + `migrate()` async. Si hay `TURSO_DATABASE_URL` usa `@libsql/client`; si no, usa `node:sqlite` local (dev/test). Asi `npm test` no necesita red. Alternativa (solo Turso) descartada: romperia dev offline.

**4. Dockerfile Node 22 + `render.yaml`.**
Base `node:22-slim`, `npm ci --omit=dev`, `CMD node src/server.js`, `PORT` de Render, healthcheck `GET /api/me` -> 401 esperado. Sin build de frontend (estatico ya compilado en `public/`).

## Risks / Trade-offs

- [Olvido de `await` en `canAccess`/`loadList`/`loadOjito`/`authFromHeader`] -> Denegacion o fuga de acceso. Mitigacion: convertir `requireAuth` y middlewares a async primero, luego handlers; tests existentes deben pasar antes de desplegar.
- [`enrichAsync` con latencia Turso 50-100ms + fetch OG 6s] -> Writes mas lentos si se hace inline. Mitigacion: mantener fire-and-forget con `catch`, no `await` en `POST /ojitos`.
- [Sleep Render 15min -> wake ~60s] -> Primera peticion lenta. Aceptado por requisito; URL no cambia. Mitigacion: documentarlo en README.
- [Limites free: Render 750h/mes + 5GB bandwidth, Turso 5GB/500M reads] -> Suficiente para 1 servicio + pruebas personales. Mitigacion: 1 sola instancia, sin cron que la despierte.
- [Secretos `TURSO_AUTH_TOKEN` en dashboard Render] -> Rotacion manual si se filtra. Mitigacion: token con minimo alcance, no en repo, `.env` ignorado.

## Migration Plan

1. Crear DB Turso + token, ejecutar `migrate()` contra Turso desde local (una vez).
2. Deploy Render con envs, verificar `GET /` y `POST /api/register` en la URL publica.
3. Smoke: crear lista + ojito + retry-preview + restart del servicio y comprobar que persisten.
4. Rollback: revertir env a `OJITO_DB` local; el codigo dual lo permite sin redeploy de codigo (solo cambio de env).

## Open Questions

Ninguna que cambie specs, enfoque o tasks. Detalles deferibles a apply: region Turso (elegir la mas cercana a Render EU), plan Render exacto (Free), nombre del servicio.
