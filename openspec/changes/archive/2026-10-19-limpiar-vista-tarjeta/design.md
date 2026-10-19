# Design

## Context

Ver `proposal.md` (Why). Estado actual: `public/app.js:70-88` renderiza en la tarjeta sin preview un `<form class="imgform">` con campo, Pegar/Guardar y preview, cableado por `wireImgForm`; la hoja de Editar (`openEditSheet`) ya ofrece titulo/nota/URL-imagen con el mismo validador. Ver specs del change para los requisitos.

## Goals / Non-Goals

**Goals:**
- Tarjeta en vista normal sin ningun control de edicion de imagen.
- La hoja de Editar queda como unico punto de edicion, sin cambios en su comportamiento.

**Non-Goals:**
- Cambios de API/BD, del parser de previews o del resto de acciones de la tarjeta (comprado, reintentar, eliminar, enlace a tienda).

## Decisions

- **Eliminar en vez de ocultar:** se borra el bloque `imgform` del render, la llamada a `wireImgForm` y la funcion entera, mas los estilos `.imgform`/`.imgrow` que queden sin uso. Alternativa descartada: ocultarlo con CSS — dejaria codigo muerto y peso en cada tarjeta.
- **Aviso corto en `noimg`:** texto estatico que dirige a Editar, sin input. Reutiliza estilos existentes.
- **Hoja de Editar intacta:** ya cumple los escenarios (preview, validacion, `PATCH`); no se toca.

## Risks / Trade-offs

- [Usuario que usaba el inline pierde un atajo] → Mitigacion: el aviso dirige a Editar, a un toque de distancia.
- [CSS huerfano si se olvida alguna clase] → Mitigacion: la tarea incluye grep de `imgform`/`wireImgForm`/`imginput`/`imgrow` con cero resultados.

## Migration Plan

Sin migracion. Despliegue = estatico (`app.js`, `styles.css`). Rollback = revert.
