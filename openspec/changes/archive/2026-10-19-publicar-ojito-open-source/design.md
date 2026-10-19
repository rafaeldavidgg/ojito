# Design

## Context

Ver `proposal.md` (Why / What Changes) para la motivación. Estado actual observado:

- Sin repo git (`fatal: not a git repository`), sin `.gitignore`, sin `LICENSE`; `package.json` declara `ISC` con `author` vacío y sin `repository`/`bugs`/`homepage`/`engines`.
- `data.sqlite` existe en la raíz con datos locales reales; `src/db.js` usa `process.env.OJITO_DB` con fallback a `data.sqlite`, y `src/server.js` usa `process.env.PORT || 3000`. No hay `.env` ni secretos hardcodeados en `src/` (verificado por búsqueda de `password|secret|token|api[_-]?key` — solo hashing scrypt y tokens de sesión en BD, sin credenciales en código).
- Stack: Express 5 + `node:sqlite` (exige Node ≥ 22), PWA estática en `public/`, tests con `node --test test/ojito.test.js`.
- `openspec/` existe con specs `wish-lists` y `saved-items`; el change declara `skip_specs: true` porque no hay cambio de comportamiento.

## Goals / Non-Goals

**Goals:**

- Que `git ls-files` del commit inicial no incluya `data.sqlite`, `.env*`, `node_modules/` ni temporales.
- Que un tercero pueda clonar, `npm install`, `npm test`, `npm start` y entender el proyecto solo con el README en español.
- Que la licencia efectiva sea MIT (archivo + campo `package.json` coherentes).
- Que la publicación en el remoto público `ojito` sea reproducible con `gh` o con pasos manuales equivalentes.

**Non-Goals:**

- Cambiar endpoints, esquema SQLite, auth o previews (comportamiento congelado).
- Reescribir la app, migrar la BD o añadir features.
- Gestionar secretos de despliegue/producción más allá de documentar `PORT`/`OJITO_DB` y `.env.example`.
- Traducir el proyecto al inglés.

## Decisions

1. **`skip_specs: true`, sin deltas de spec.**
   Por qué: el cambio es tooling/docs/publicación; ningún requisito de `wish-lists`/`saved-items` cambia. Alternativa (crear capability `open-source-hygiene`): rechazada — inventaría requisitos de comportamiento donde no los hay y `validate` lo desaconseja.

2. **Licencia MIT (archivo `LICENSE` + `license: MIT` en `package.json`).**
   Por qué: decisión explícita del usuario en este workflow; es la estándar permisiva en GitHub. Alternativa (mantener ISC): rechazada por el usuario. Detalle: año y titular como placeholders a confirmar en apply (`LICENSE` necesita nombre del autor; `package.json.author` está vacío).

3. **`.gitignore` amplio desde el commit inicial + `.gitattributes`.**
   Contenido: `node_modules/`, `*.sqlite*` y `data.sqlite`, `.env*` (excepto `.env.example`), `coverage/`, `*.log`, `.DS_Store`/`Thumbs.db`, `.vscode/` (parcial), `.opencode/` (ver punto 5). `.gitattributes`: normalizar `text=auto eol=lf`. Por qué: el riesgo principal es filtrar la BD local en el primer commit; el ignore debe existir *antes* del `git add`. Alternativa (ignore mínimo): rechazada — deja huecos (`.env`, cobertura, temporales).

4. **`.env.example` con `PORT` y `OJITO_DB`, sin `.env` real.**
   Por qué: son las únicas dos variables observadas en código; documentarlas evita que un colaborador adivine. `OJITO_DB` permite tests/dev sin tocar `data.sqlite`. Alternativa (no tocar env): rechazada — el README las mencionaría sin ejemplo copiable.

5. **Conservar `openspec/` en el repo público.**
   Por qué: es documentación de diseño valiosa y no contiene secretos; refuerza el perfil open-source del autor. Alternativa (excluirlo vía `.gitignore`): posible pero pierde valor; se deja como decisión reversible — si en apply aparece algo sensible dentro, se excluye.

6. **Publicación con `gh repo create ojito --public --source=. --remote=origin --push`, rama `main`, con fallback manual.**
   Por qué: el usuario eligió "preparar y publicar con `gh`". Fallback si `gh` no está autenticado: `git init -b main`, commit, crear repo vacío `ojito` en github.com, `git remote add origin … && git push -u origin main`. Verificación post-push obligatoria: `git ls-files | grep -E 'sqlite|env$|node_modules'` vacío + inspección del árbol remoto.

7. **Docs en español + plantillas `.github/` mínimas (CI + bug/feature/PR).**
   Por qué: decisión del usuario; CI ejecuta `npm test` en Node 22 (por `node:sqlite`). Alternativa (sin CI): rechazada — un repo público sin CI invita a PRs rotos.

## Risks / Trade-offs

- [Riesgo] `data.sqlite` con datos reales acaba en el commit inicial → Mitigación: crear `.gitignore` antes de `git add`, verificar con `git status --porcelain` y `git ls-files`, y borrar/mover la BD local fuera del árbol o dejarla ignorada antes del commit.
- [Riesgo] `gh` no instalado o no autenticado en la máquina de apply → Mitigación: tareas con rama de fallback manual y criterio de aceptación "remoto existe y es público" verificable por URL.
- [Riesgo] Nombre `ojito` ya ocupado en el namespace del usuario → Mitigación: la tarea de publicación contempla renombrar o usar el siguiente nombre disponible solo con confirmación del usuario; nunca publicar en otro nombre sin preguntar.
- [Riesgo] Titular de licencia desconocido (`author` vacío) → Mitigación: placeholder en `LICENSE`/`package.json` y pregunta al usuario en apply antes del commit.
- [Riesgo] `openspec/` pudiera contener notas privadas → Mitigación: pasada de `grep` de secretos sobre todo el árbol incluido `openspec/` antes del commit.
- [Trade-off] `.gitignore` amplio puede ocultar archivos que alguien querría versionar (p. ej. `.vscode/`): se acepta a cambio de seguridad por defecto; la lista es editable.

## Migration Plan

No hay migración de datos ni despliegue: la app sigue corriendo igual en local. Pasos de apply (detalle en `tasks.md`): higiene → metadatos/licencia → docs → `git init` + commit inicial → `gh repo create ojito --public --push` (o fallback) → verificación post-push. Rollback: si el push filtró algo sensible, eliminar el remoto o hacerlo privado de inmediato, rotar lo expuesto, reescribir historia local y volver a publicar; como es repo nuevo sin colaboradores, el coste es bajo.

## Open Questions

- Titular y año para `LICENSE` y campo `author` de `package.json` (se preguntará en apply; por defecto año 2026 y titular pendiente).
- URL final del remoto (`github.com/<usuario>/ojito`): se conoce el nombre `ojito` pero no el usuario; se resolverá con `gh api user` en apply.
