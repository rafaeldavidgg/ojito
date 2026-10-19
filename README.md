# Ojito 👀

Listas privadas de deseos multi-tienda. Pega un enlace (Zara, Primor, Victoria's Secret…),
se guarda en una lista (Navidad, Aniversario, Caprichos caros) con preview best-effort.

![CI](https://github.com/rafaeldavidgg/ojito/actions/workflows/ci.yml/badge.svg)
![Licencia MIT](https://img.shields.io/badge/licencia-MIT-green)
![Node >= 22](https://img.shields.io/badge/node-%3E%3D22-brightgreen)

## Características

- **Listas privadas** por ocasión, aisladas por pertenencia (`memberships`).
- **Ojitos**: guarda cualquier producto a partir de su URL; solo la URL es obligatoria.
- **Previews best-effort**: título e imagen vía OpenGraph sin bloquear el guardado; edición manual cuando la tienda lo bloquea.
- **Estados**: pendiente / comprado, con filtro por estado.
- **Modelo share-ready**: compartir en v2 será insertar filas (`editor`/`viewer`), sin migraciones.
- **PWA**: frontend estático instalable (`public/`).

## Requisitos

- **Node.js ≥ 22** (se usa `node:sqlite`, disponible desde Node 22).
- `npm` (incluido con Node).

## Instalación y arranque

```sh
git clone https://github.com/rafaeldavidgg/ojito.git
cd ojito
npm install
npm start   # http://localhost:3000
```

La app sirve la API (`/api/*`) y el frontend PWA desde el mismo proceso.

## Configuración

Toda la configuración es opcional y va por variables de entorno. Copia la plantilla:

```sh
cp .env.example .env
```

| Variable   | Por defecto      | Descripción                              |
|------------|------------------|------------------------------------------|
| `PORT`     | `3000`           | Puerto HTTP donde escucha la app.        |
| `OJITO_DB` | `./data.sqlite`  | Ruta del fichero SQLite.                 |

Ejemplos:

```sh
PORT=3100 npm start                          # otro puerto
OJITO_DB=./data.dev.sqlite npm start         # BD separada para desarrollo
```

> ⚠️ `data.sqlite` y `.env` son locales y **nunca** se suben al repo (ver `.gitignore`).
> Para pruebas sin tocar tu BD local, apunta `OJITO_DB` a una ruta temporal.

## Uso

1. Abre `http://localhost:3000`.
2. Crea una cuenta (email + contraseña de mínimo 8 caracteres) o entra con la tuya.
3. Crea una lista (p. ej. `Navidad`).
4. Pega la URL de un producto en la lista. Se guarda al instante; el título y la imagen
   se rellenan en segundo plano si la tienda lo permite.
5. Si el preview falla (`preview_status='unavailable'`), edita título/imagen a mano o
   reintenta con `POST /api/ojitos/:id/retry-preview`.
6. Marca como comprado cuando toque; filtra por estado dentro de la lista.

### API (resumen)

Auth con `Authorization: Bearer <token>`.

| Método | Ruta                              | Descripción                                  |
|--------|-----------------------------------|----------------------------------------------|
| POST   | `/api/register`                   | Crea cuenta y devuelve sesión.               |
| POST   | `/api/login`                      | Inicia sesión.                               |
| POST   | `/api/logout`                     | Cierra la sesión actual.                     |
| GET    | `/api/me`                         | Usuario actual.                              |
| GET    | `/api/lists`                      | Listas propias (`?archived=1` las incluye).  |
| POST   | `/api/lists`                      | Crea lista privada (`title`, max 80).        |
| GET    | `/api/lists/:id`                  | Detalle de lista propia.                     |
| PATCH  | `/api/lists/:id`                  | Renombra (`title`) o archiva (`archived`).   |
| DELETE | `/api/lists/:id`                  | Elimina lista.                               |
| GET    | `/api/lists/:id/ojitos`           | Ojitos (`?status=pending\|purchased`).        |
| POST   | `/api/lists/:id/ojitos`           | Guarda ojito (solo `url` obligatoria).       |
| GET    | `/api/ojitos/:id`                 | Detalle de ojito.                            |
| PATCH  | `/api/ojitos/:id`                 | Edita campos o marca `status`.               |
| DELETE | `/api/ojitos/:id`                 | Elimina ojito.                               |
| POST   | `/api/ojitos/:id/retry-preview`   | Reintenta el preview OpenGraph.              |

## Estructura del proyecto

```
src/
  server.js    # arranque: abre BD, migra, escucha en PORT
  app.js       # rutas Express + enriquecimiento en background
  db.js        # SQLite (node:sqlite) y migraciones
  auth.js      # registro, login, sesiones Bearer
  preview.js   # fetch OpenGraph best-effort (timeout, límite, anti-SSRF)
  utils.js     # ids, normalización de URLs, detección de tienda, hashing
public/        # PWA estática (index.html, app.js, styles.css, sw.js, manifest)
test/          # tests con node:test (node --test)
openspec/      # especificaciones y decisiones de diseño del proyecto
```

## Modelo de datos (share-ready)

v1 es privado, v2 será compartido **sin migración**:

- `users(id, email, password_hash)` — identidad estable desde v1.
- `lists(id, title, visibility='private', created_by, archived_at)` — **sin `user_id`
  directo**. Todo acceso pasa por `memberships`.
- `memberships(list_id, user_id, role)` — v1 crea 1 fila `owner` por lista.
  Compartir en v2 = insertar filas (`editor`/`viewer`).
- `ojitos(id, list_id, url, normalized_url, title, store, image_url, price_snapshot,
  note, status, preview_status, added_by)` — `added_by` distingue quién aportó desde el día 1.

Reglas: toda lectura/escritura de lista u ojito exige pertenencia. `visibility` siempre
`private` en v1.

## Previews

`POST /api/lists/:id/ojitos` guarda al instante y dispara `fetchPreview` en background
(timeout 6 s, límite 500 KB, máx. 3 redirects, bloqueo SSRF básico). Si falla →
`preview_status='unavailable'` y edición manual. Reintento:
`POST /api/ojitos/:id/retry-preview`.

## Seguridad

- Contraseñas con `scrypt` + salt aleatorio; comparación en tiempo constante.
- Sesiones Bearer opacas en tabla `sessions` (se revocan con logout).
- Toda lista/ojito exige pertenencia; lo ajeno responde `404` (sin oráculo de existencia).
- Fetch de previews con timeout, tope de tamaño y bloqueo SSRF básico (sin hosts
  locales ni IPs privadas).
- Para reportar vulnerabilidades, ver [SECURITY.md](SECURITY.md). **Nunca** subas
  `data.sqlite`, `.env` ni credenciales en issues o PRs.

## Tests

```sh
npm test   # node --test test/ojito.test.js (usa BD en memoria)
```

Cubre: esquema share-ready, aislamiento de listas por membership, CRUD de ojitos y
preview bloqueada sin impedir el guardado.

## Roadmap

- [ ] Compartir listas (roles `editor`/`viewer`, invitaciones) — sin migración, ver modelo.
- [ ] Detección de precio y alertas de bajadas.
- [ ] Mejoras PWA (offline, notificaciones).
- [ ] Despliegue documentado (Docker / servicio gestionado).

## Contribuir

¡Las contribuciones son bienvenidas! Lee [CONTRIBUTING.md](CONTRIBUTING.md) y el
[Código de Conducta](CODE_OF_CONDUCT.md) antes de abrir un issue o PR.

## Licencia

[MIT](LICENSE) — haz lo que quieras, cita el origen. Ver `LICENSE` para el texto completo.
