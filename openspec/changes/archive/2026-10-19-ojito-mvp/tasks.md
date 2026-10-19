# Tasks

## 1. Base y modelo share-ready

- [x] 1.1 Decidir stack v1 (frontend PWA + backend unico + auth + DB) y dejarlo registrado en design y verificar que soporta fetch server-side y migraciones
- [x] 1.2 Crear esquema `Lista`, `Membership`, `Ojito` segun design sin `user_id` directo y verificar via migracion aplicada + test de que crear lista genera 1 membership owner
- [x] 1.3 Implementar auth minima con identidad estable y verificar login/logout crea user persistente y protege endpoints sin token
- [x] 1.4 Documentar modelo y reglas de acceso por membership en README o docs y verificar que el doc describe v1 privado y camino a v2 compartido

## 2. Listas privadas

- [x] 2.1 Implementar CRUD de listas (crear, renombrar, archivar, eliminar con confirmacion) con validacion de nombre y verificar con tests de API + prueba manual movil
- [x] 2.2 Implementar listado "mis listas" filtrado por membership ordenado por actualizacion y verificar que otro usuario no ve ni accede a listas ajenas (test 403/404)
- [x] 2.3 Implementar UI movil-first de listas (vacia, con N ojitos, estados archivado) y verificar visualmente en viewport movil que crear/renombrar/eliminar funciona sin recarga completa

## 3. Ojitos multi-tienda

- [x] 3.1 Implementar guardado minimo por URL http(s) con normalizacion, deteccion best-effort de tienda y estado pendiente y verificar que URL tipo Zara/VS/Primor se guarda y URL invalida se rechaza
- [x] 3.2 Implementar ficha y edicion de ojito (titulo, tienda, imagen, precio snapshot, nota, URL) y verificar con test de persistencia + edicion manual tras preview fallida
- [x] 3.3 Implementar marcar pendiente/comprado y filtro por estado y verificar que el filtro de pendientes excluye comprados y el cambio guarda fecha

## 4. Preview best-effort no bloqueante

- [x] 4.1 Implementar fetcher server-side de OG titulo/imagen con timeout corto, limite de tamano/redirects y proteccion SSRF y verificar que nunca bloquea el guardado (guardado responde aunque el fetch falle)
- [x] 4.2 Implementar reintento manual de preview y estado "preview no disponible" y verificar que el usuario puede corregir a mano y reintentar

## 5. Integracion y cierre v1

- [x] 5.1 Verificar flujo end-to-end movil: login -> crear lista Navidad -> pegar 3 URLs reales multi-tienda -> editar una a mano -> marcar una comprada y verificar que todo persiste tras recarga
- [x] 5.2 Verificar robustez share-ready: inspeccionar DB de que no existe `lista.user_id`, toda lista tiene membership y `added_by` cubierto, y verificar que anadir un segundo miembro en SQL otorga acceso sin migracion

## Workflow follow-up

- Revisar artefactos con el usuario antes de implementar.
- Cuando este listo, ejecutar `/opsx-apply` para implementar.
