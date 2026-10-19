# Tasks

## 1. Capa DB dual local/Turso

- [x] 1.1 Anadir `@libsql/client` a `package.json` y crear cliente dual en `src/db.js` (`TURSO_*` o fallback `node:sqlite`) y verificar con `npm install` y `node -e "require('./src/db.js')"` sin env que usa fichero local
- [x] 1.2 Hacer `migrate()` async compatible con ambos backends y verificar con `OJITO_DB=./data.test.sqlite node -e "require('./src/db.js').migrate(require('./src/db.js').openDb())"` y tablas creadas
- [x] 1.3 Anadir helper `execute(sql, args)` que mapee `get/all/run` y verificar con test manual de insert/select en SQLite local

## 2. Refactor async sin cambio de API

- [x] 2.1 Convertir `src/auth.js` (`register/login/authFromHeader/requireAuth`) a async y verificar con `npm test` en modo local
- [x] 2.2 Convertir `canAccess`, `touchList`, `enrichAsync`, `loadList`, `loadOjito` y todos los handlers de `src/app.js` a async/await y verificar con `npm test` y que no queda ningun `db.prepare` sincrono (`grep -r "db.prepare" src/` vacio salvo fallback)
- [x] 2.3 Convertir `src/server.js` a arranque async (`await migrate()` antes de `listen`) y verificar con `PORT=3100 OJITO_DB=./data.dev.sqlite npm start` y `curl localhost:3100/` 200

## 3. Despliegue 0E Render + Turso

- [x] 3.1 Crear `Dockerfile` Node 22-slim (`npm ci --omit=dev`, `CMD node src/server.js`) y verificar con `docker build -t ojito .` y `docker run -p 3000:3000 ojito` responde
- [x] 3.2 Crear `render.yaml` (1 web service Free, `PORT`, healthcheck) y verificar con `openspec` o Render dashboard que el plan detecta 1 servicio Free sin disco
- [x] 3.3 Crear DB y token en Turso, ejecutar migracion remota una vez y verificar con query de conteo de tablas remota no vacia
- [x] 3.4 Desplegar en Render con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` y verificar con `POST /api/register`, `POST /api/lists`, `POST /api/lists/:id/ojitos` en la URL publica

## 4. Persistencia y docs

- [x] 4.1 Verificar persistencia tras sleep/redeploy: crear lista+ojito, reiniciar servicio en Render, comprobar que `GET /api/lists` y `GET /api/lists/:id/ojitos` devuelven lo mismo
- [x] 4.2 Documentar en `README.md` despliegue Render+Turso, envs y limite sleep 60s, y verificar que los comandos documentados corren tal cual (`npm start`, `docker build`, curl de smoke)
