# Design

## Context

Greenfield, sin codigo ni specs previas. Ver `proposal.md - Why` para motivacion. Restricciones v1: uso privado por usuario (sin UI de compartir), multi-tienda con previews frecuentemente bloqueadas, movil-first para pegar links rapido. El modelo debe permitir listas compartidas en v2 sin migracion.

## Goals / Non-Goals

**Goals:**
- Listas privadas rapidas + guardado minimo por URL que nunca se pierde.
- Esquema share-ready (Membership) usable en v1 con 1 miembro sin complicar la UI.
- Previews best-effort aisladas del path critico de guardado.

**Non-Goals:**
- UI de invitaciones, roles editables y modo sorpresa (solo columnas preparadas).
- Tracking de precio/stock, alertas de rebajas, checkout o scraping profundo por tienda.

## Decisions

- **Modelo Lista sin `user_id`: acceso via `Membership(list_id, user_id, role)` + `Lista(id, title, visibility=private, created_by, archived_at)`.** Razon: v1 crea 1 fila owner; v2 compartir = insertar filas, cero migracion. Alternativa descartada: FK directo `list.owner_id` (simple hoy, rompe manana).
- **`Ojito(id, list_id, url, normalized_url, title, store, image_url, price_snapshot, note, status, added_by)` con `added_by` desde v1.** Razon: en v1 siempre es el owner, en v2 distingue quien aporto/marco. `price_snapshot` es texto Libre, no precio trackeado.
- **Auth minima con identidad estable (email magic-link u OAuth) desde v1.** Razon: sin user id real no hay Membership futura. Alternativa anonima local-first descartada porque bloquea compartir.
- **Preview server-side asincrona con timeout corto + cache, nunca bloquea el guardado.** Flujo: guardar URL -> responder ya -> job intenta OG tags -> prerrellena si ok. Razon: Zara/Shein/Amazon bloquean o tardan; el valor es no perder el link. Alternativa scraping cliente descartada por CORS/anti-bot.
- **PWA movil-first + backend unico (API + auth + fetch previews).** Razon: pegar links desde el movil es el caso dominante; un solo deploy reduce operacion en v1. Sin decision de stack concreto aqui.
- **Stack v1 (decidido): Node 22 + Express + node:sqlite (DatabaseSync) + frontend vanilla sin build (PWA).** Razon: cero dependencias nativas, migraciones SQL simples, fetch server-side con `fetch` + AbortController, un solo `npm start`. Soporta previews y modelo Membership sin ORM.

## Risks / Trade-offs

- [Previews fallan a menudo por anti-bot] -> Mitigacion: fallback manual de primera clase (titulo/imagen/nota editables), reintento manual, timeout y error visible no bloqueante.
- [Sobre-ingenieria de sharing] -> Mitigacion: solo esquema + checks de acceso por membership; sin UI/roles en v1.
- [URLs duplicadas o rotas] -> Mitigacion: normalizacion basica + validacion http(s); sin dedupe agresiva en v1.
- [Abuso del fetcher server-side (SSRF)] -> Mitigacion: allowlist http(s), timeout, limite de tamano, limite de redirects, no guardar HTML completo.

## Migration Plan

- v1 crea tablas nuevas, sin migracion (greenfield). Rollback: feature flag de previews y borrado logico de listas (`archived_at`) antes que borrado fisico.
- Camino a v2: anadir endpoints invitar/aceptar + `visibility=shared`; los checks ya usan Membership, no requieren backfill salvo marcar listas existentes como private.

## Open Questions

- Proveedor de auth definitivo y almacenamiento de imagenes (URLs remotas vs subida propia) — respondible sin cambiar specs ni tareas.
