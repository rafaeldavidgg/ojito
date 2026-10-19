# Spec Delta

## MODIFIED Requirements

### Requirement: Ver y editar detalle del ojito
El sistema SHALL permitir ver y editar titulo, tienda, imagen, precio, nota y URL de cada ojito propio desde la hoja de Editar, y SHALL mostrar en la tarjeta sin preview un aviso corto que dirige a Editar en lugar de un formulario inline.

#### Scenario: Edicion manual tras fallo de preview
- **WHEN** el usuario edita titulo a "Tonico Primor" y sube nota "piel sensible"
- **THEN** el sistema persiste los cambios y los muestra en la ficha

#### Scenario: Introducir URL de imagen a mano en movil
- **WHEN** la ficha no tiene preview y el usuario pega una URL http(s) de imagen en el campo "URL de la imagen"
- **THEN** el sistema muestra vista previa instantanea en cliente y al guardar persiste `image_url` y la muestra en la ficha

#### Scenario: Introducir URL de imagen desde Editar en movil
- **WHEN** la ficha no tiene preview y el usuario abre Editar y pega una URL http(s) de imagen en el campo "URL de la imagen"
- **THEN** el sistema muestra vista previa instantanea en la hoja y al guardar persiste `image_url` y la muestra en la ficha

#### Scenario: URL de imagen invalida rechazada con mensaje claro
- **WHEN** el usuario pega "foto pantalon" o un esquema no http(s) en el campo de imagen de Editar
- **THEN** el sistema rechaza solo ese campo con error de validacion, no borra la imagen previa y explica el formato esperado

#### Scenario: Tarjeta sin formulario inline
- **WHEN** una ficha no tiene preview y el usuario mira la tarjeta en vista normal
- **THEN** el sistema no muestra campo ni botones de imagen y muestra un aviso que dirige a Editar
