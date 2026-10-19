# Proposal

## Why

Ojito vive hoy como proyecto local sin git, sin licencia y sin higiene de secretos: existe `data.sqlite` con datos reales, no hay `.gitignore`, la licencia declarada (`ISC`) no tiene archivo `LICENSE`, y el `README` es mínimo. Para publicarlo como repositorio público `ojito` en GitHub de forma segura y presentable, hay que dejar el repo limpio, documentado y publicado sin filtrar credenciales ni datos locales.

## What Changes

- Higiene de secretos y artefactos locales: ignorar y des-trackear `data.sqlite`, `*.sqlite*`, `.env*`, `node_modules/`, cobertura y temporales del OS/editor; verificar que no hay claves, tokens ni URLs privadas hardcodeadas en `src/`, `public/`, `test/`.
- Metadatos del paquete: `package.json` con `license: MIT`, `repository`, `bugs`, `homepage`, `keywords`, `engines` (Node ≥ 22 por `node:sqlite`), `files`, sin `author` vacío.
- Licencia MIT: crear `LICENSE` con texto MIT y año/autor parametrizable.
- Documentación en español: `README.md` completo (qué es, demo local, requisitos, instalación, uso, variables `PORT`/`OJITO_DB`, scripts, estructura, modelo share-ready, previews, seguridad, tests, roadmap, cómo contribuir, licencia), más `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant), `SECURITY.md` (cómo reportar, alcance, no subir datos reales) y plantillas `.github/` (bug report, feature request, PR, CI `npm test` en Node 22).
- Publicación: `git init` (si falta), rama `main`, commit inicial limpio, `gh repo create ojito --public --source=. --remote=origin --push` o instrucciones equivalentes si `gh` no está autenticado; verificación post-push (el repo remoto no contiene `data.sqlite`, `.env` ni `node_modules`).
- **BREAKING**: ninguno para la app en ejecución. El cambio no altera endpoints, modelo de datos ni comportamiento; solo archivos de repo y documentación.

## Capabilities

### New Capabilities

- Ninguna. Este cambio no introduce comportamiento observable del sistema; es preparación y publicación del repositorio.

### Modified Capabilities

- Ninguna. No cambian requisitos de `wish-lists` ni `saved-items`.

> Nota: cambio de tooling/docs sin deltas de spec; se marca `skip_specs: true` en `.openspec.yaml`.

## Impact

- Archivos afectados: raíz (`package.json`, `README.md`, `LICENSE`, `.gitignore`, `.gitattributes`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.env.example`), `.github/` (workflows + plantillas), `openspec/` (se conserva como documentación del proyecto salvo decisión contraria en el diseño).
- Sistemas: git local (nuevo repo, rama `main`), GitHub remoto `ojito` público vía `gh`; CI GitHub Actions (`npm test`).
- Riesgos: filtrar `data.sqlite` o `.env` en el commit inicial; mitigación con `.gitignore` + verificación `git status`/`git ls-files` antes del push.
- Sin impacto en API, frontend PWA, ni esquema SQLite.
