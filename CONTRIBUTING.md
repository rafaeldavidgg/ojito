# Cómo contribuir a Ojito

¡Gracias por querer contribuir! Este documento explica el flujo de trabajo.
Para las normas de convivencia, lee el [Código de Conducta](CODE_OF_CONDUCT.md).
Para vulnerabilidades, **no** abras un issue público: sigue [SECURITY.md](SECURITY.md).

## Requisitos

- Node.js ≥ 22 (`node:sqlite` lo exige) y `npm`.
- Una cuenta de GitHub.

## Puesta en marcha

```sh
git clone https://github.com/rafaeldavidgg/ojito.git
cd ojito
npm install
cp .env.example .env   # opcional; ajusta PORT / OJITO_DB si lo necesitas
npm test               # debe estar en verde antes de tocar nada
npm start              # http://localhost:3000
```

## Flujo de cambios

1. Abre (o elige) un issue que describa el problema o la mejora.
2. Crea una rama desde `main`: `git checkout -b <tipo>/<descripcion-corta>`
   (`feat/`, `fix/`, `docs/`…).
3. Haz cambios pequeños y enfocados. No mezcles refactors con features.
4. Añade o actualiza tests si cambias comportamiento (`test/ojito.test.js`,
   con `node:test`, BD en memoria — no tocan tu `data.sqlite`).
5. Ejecuta `npm test` y deja todo en verde.
6. Actualiza la documentación afectada (`README.md`, `openspec/` si cambia el diseño).
7. Abre un Pull Request contra `main` usando la plantilla. Describe qué cambia,
   por qué y cómo lo verificaste.

## Estilo

- Español en la interfaz y mensajes de error (coherente con el proyecto).
- JavaScript CommonJS, sin dependencias nuevas salvo necesidad justificada.
  Si propones una dependencia, explícalo en el PR (tamaño, mantenimiento, alternativas).
- Sin secretos ni credenciales en el código. Las únicas variables de entorno
  soportadas hoy son `PORT` y `OJITO_DB`; documenta en `.env.example` cualquier añadido.
- Respeta el modelo share-ready: nada de `user_id` directo en `lists`;
  todo acceso pasa por `memberships` (ver `README.md`).

## Tests

```sh
npm test
```

- Los tests usan SQLite en memoria (`openDb(':memory:')`); son rápidos y herméticos.
- Si tu cambio toca previews, recuerda que el fetch es best-effort con timeout
  de 6 s: los tests no deben depender de red externa.

## Qué nunca debe subir al repo

- `data.sqlite` (u otros `*.sqlite*`): contienen datos reales.
- `.env` o cualquier fichero con credenciales.
- `node_modules/`, cobertura o logs.

Están en `.gitignore`; si `git status` muestra algo así, para y pregunta antes
de hacer commit.

## Licencia

Al contribuir aceptas que tu aportación se distribuya bajo la licencia
[MIT](LICENSE) del proyecto.
