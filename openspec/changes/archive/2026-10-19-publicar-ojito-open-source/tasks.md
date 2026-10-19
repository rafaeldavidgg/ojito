# Tasks

## 1. Higiene de secretos y artefactos locales

- [x] 1.1 Pasar `grep` de secretos a todo el árbol (`src/`, `public/`, `test/`, `openspec/`, raíz) buscando `BEGIN PRIVATE KEY`, `api[_-]?key`, `ghp_`, `AKIA`, `password\s*=\s*["']`, URLs privadas, y verificar que no hay hallazgos salvo hashing scrypt y tokens de sesión en BD.
- [x] 1.2 Crear `.gitignore` (antes de cualquier `git add`) con `node_modules/`, `*.sqlite*`/`data.sqlite`, `.env*` excepto `.env.example`, `coverage/`, `*.log`, temporales OS/editor, y verificar con `git check-ignore data.sqlite .env node_modules` que los tres quedan ignorados.
- [x] 1.3 Crear `.gitattributes` con `* text=auto eol=lf` y verificar que `git check-attr text eol -- README.md package.json` devuelve los atributos esperados.
- [x] 1.4 Crear `.env.example` con `PORT=3000` y `OJITO_DB=./data.sqlite` comentados, y verificar que arrancar con `OJITO_DB=:memory:` (o ruta temporal) no toca `data.sqlite`.

## 2. Licencia y metadatos del paquete

- [x] 2.1 Crear `LICENSE` con texto MIT (año 2026, titular pendiente de confirmar con el usuario en apply) y verificar que contiene `MIT License` y el año.
- [x] 2.2 Actualizar `package.json` (`license: MIT`, `repository`/`bugs`/`homepage` apuntando a `github.com/<usuario>/ojito`, `keywords`, `engines: node >=22`, `files` excluyendo sqlite/env) y verificar con `npm pkg get license engines` y `npm test` en verde (sin cambios de comportamiento).

## 3. Documentación y comunidad (español)

- [x] 3.1 Reescribir `README.md` en español (qué es, requisitos Node ≥ 22, instalación, `npm start`/`npm test`, variables `PORT`/`OJITO_DB`, estructura, modelo share-ready, previews best-effort, seguridad, roadmap, licencia) y verificar que cada comando documentado ejecuta tal cual en un clon limpio.
- [x] 3.2 Crear `CONTRIBUTING.md` (cómo proponer cambios, estilo, tests obligatorios), `CODE_OF_CONDUCT.md` (Contributor Covenant) y `SECURITY.md` (cómo reportar vulnerabilidades, alcance, nunca subir `data.sqlite` ni `.env`), y verificar enlaces cruzados README ↔ CONTRIBUTING ↔ SECURITY sin rotos.
- [x] 3.3 Crear `.github/` (workflow CI `npm test` en Node 22 + plantillas de bug, feature y PR) y verificar el YAML con `npx --yes js-yaml` o equivalente y disparo del workflow en el primer push.

## 4. Git local y publicación en GitHub

- [x] 4.1 Confirmar con el usuario el titular de `LICENSE`/`author` y el usuario de GitHub, ajustar los placeholders, y verificar `git diff --stat` solo toca archivos previstos.
- [x] 4.2 Inicializar git (`git init -b main` si falta), `git add` selectivo y commit inicial, y verificar con `git status --porcelain` limpio y `git ls-files | grep -E 'sqlite|\.env$|node_modules'` vacío.
- [x] 4.3 Publicar con `gh repo create ojito --public --source=. --remote=origin --push` (fallback manual: crear repo vacío `ojito` en la web y `git remote add origin … && git push -u origin main`; si el nombre está ocupado, parar y preguntar, nunca publicar con otro nombre sin confirmación), y verificar que el remoto existe, es público y la rama por defecto es `main`.

## 5. Verificación del repo público

- [x] 5.1 Verificar en la web del repo `ojito` que el árbol no contiene `data.sqlite`, `.env` ni `node_modules`, que `LICENSE` se detecta como MIT y que el CI corre `npm test` en verde.
- [x] 5.2 Clonar el repo público en un directorio temporal, ejecutar `npm install && npm test && PORT=3100 npm start` y verificar arranque y tests en verde desde el clon limpio.

## Workflow follow-up

- Revisar los artefactos de este change y archivar con `openspec archive` cuando la revisión del proyecto lo permita.
