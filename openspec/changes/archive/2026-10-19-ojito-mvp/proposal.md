# Proposal

## Why

Los enlaces de productos que llegan por WhatsApp (Zara, Victoria's Secret, Primor...) se pierden entre mensajes y no están agrupados por intención de compra. Se necesita un sitio único donde guardarlos por ocasión y recuperarlos al comprar.

## What Changes

- Crear listas privadas por ocasión (ej. Regalos Navidad, Aniversario, Caprichos caros): crear, renombrar, archivar/eliminar.
- Guardar "ojitos" (productos) en una lista a partir de una URL de cualquier tienda. Solo la URL es obligatoria; título, tienda, imagen, precio y nota son opcionales/editables.
- Enriquecimiento best-effort al pegar URL (título + imagen vía OpenGraph o similar). Si falla, se guarda igual con fallback manual.
- Modelo de datos share-ready desde v1: Lista sin `user_id` directo, acceso vía `Membership` (1 miembro owner en v1), `Ojito` con `added_by`. Sin UI de compartir en v1.
- Auth mínima para tener identidad estable (prepara compartir futuro).
- Explícitamente fuera de v1: listas compartidas/invitaciones UI, aviso de rebajas, tracking de precio/stock, checkout, extensiones de navegador.

## Capabilities

### New Capabilities

- `wish-lists`: crear y gestionar listas privadas de deseos agrupadas por ocasión, con modelo de pertenencia preparado para compartir futuro.
- `saved-items`: guardar, ver, editar y marcar ojitos (URLs de productos multi-tienda) dentro de una lista, con enriquecimiento best-effort.

### Modified Capabilities

- Ninguna (proyecto greenfield, sin specs previas).

## Impact

- Greenfield: no hay código, APIs ni dependencias existentes afectadas.
- Implica nuevo frontend móvil-first (PWA) + backend con auth, almacenamiento de listas/ojitos y fetch server-side para previews.
- Riesgo principal: previews bloqueadas por anti-bot de tiendas; mitigado por diseño best-effort + edición manual.
