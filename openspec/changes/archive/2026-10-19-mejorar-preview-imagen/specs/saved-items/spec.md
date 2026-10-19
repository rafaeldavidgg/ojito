# Spec Delta

## MODIFIED Requirements

### Requirement: Enriquecimiento best-effort no bloqueante
El sistema SHALL intentar obtener titulo e imagen al guardar desde mas fuentes gratuitas presentes en el HTML (OpenGraph ampliado, Twitter Cards, image_src y JSON-LD) y SHALL guardar igual el ojito si el fetch falla o expira, permitiendo correccion manual posterior.

#### Scenario: Preview conseguida
- **WHEN** la tienda expone OpenGraph y el fetch responde a tiempo
- **THEN** el sistema prerrellena titulo e imagen dejando edicion abierta

#### Scenario: Preview conseguida con fuente alternativa
- **WHEN** la tienda expone la imagen solo en `twitter:image` o JSON-LD y el fetch responde a tiempo
- **THEN** el sistema prerrellena titulo e imagen dejando edicion abierta

#### Scenario: Tienda bloquea el fetch
- **WHEN** el fetch falla, expira o es bloqueado por anti-bot (p. ej. 403 Cloudflare)
- **THEN** el sistema guarda el ojito solo con la URL y marca que la preview no esta disponible e indica que hay que introducir la imagen a mano

### Requirement: Ver y editar detalle del ojito
El sistema SHALL permitir ver y editar titulo, tienda, imagen, precio, nota y URL de cada ojito propio, y SHALL mostrar de forma explicita cuando la imagen debe introducirse a mano con ayuda para hacerlo desde el movil.

#### Scenario: Edicion manual tras fallo de preview
- **WHEN** el usuario edita titulo a "Tonico Primor" y sube nota "piel sensible"
- **THEN** el sistema persiste los cambios y los muestra en la ficha

#### Scenario: Introducir URL de imagen a mano en movil
- **WHEN** la ficha no tiene preview y el usuario pega una URL http(s) de imagen en el campo "URL de la imagen"
- **THEN** el sistema muestra vista previa instantanea en cliente y al guardar persiste `image_url` y la muestra en la ficha

#### Scenario: URL de imagen invalida rechazada con mensaje claro
- **WHEN** el usuario pega "foto pantalon" o un esquema no http(s) en el campo de imagen
- **THEN** el sistema rechaza solo ese campo con error de validacion, no borra la imagen previa y explica el formato esperado
