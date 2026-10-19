# Proposal

## Why

El formulario inline de "URL de la imagen" dentro de las tarjetas ensucia la vista normal y duplica la edicion: el usuario ya valora bien la hoja de Editar y quiere que toda la edicion viva alli.

## What Changes

- La tarjeta en vista normal deja de mostrar el formulario inline de "URL de la imagen" (campo, botones Pegar/Guardar imagen, ayuda y vista previa inline) cuando no hay preview.
- La tarjeta sin preview muestra un aviso corto que dirige a Editar (p. ej. "Sin preview — usa Editar para añadir la imagen").
- Toda la edicion de imagen (pegar URL, vista previa, validacion, guardado) queda solo en la hoja de Editar, sin cambios en su comportamiento actual.
- Supuesto registrado: el enlace corto a la tienda (`a.url`) se mantiene en la tarjeta como navegacion para abrir el producto; lo que se quita es solo el bloque de edicion inline.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `saved-items`: la introduccion manual de la imagen deja de ofrecerse en la tarjeta y pasa a estar solo en Editar (requisito "Ver y editar detalle del ojito").

## Impact

- Afectado: `public/app.js` (render de tarjeta, funcion `wireImgForm`), `public/styles.css` (estilos `.imgform`).
- No afecta: API/BD (`PATCH image_url` sin cambios), hoja de Editar, parser de previews, tests de backend existentes.
