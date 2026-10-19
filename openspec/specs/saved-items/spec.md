# saved-items Specification

## Purpose

Permite guardar cualquier producto de cualquier tienda a partir de su URL dentro de una lista, con enriquecimiento automatico opcional y edicion manual cuando la tienda lo bloquea.

## Requirements

### Requirement: Guardar ojito desde URL
El sistema SHALL permitir guardar un ojito en una lista propia a partir de una URL http(s) valida. Solo la URL es obligatoria.

#### Scenario: Guardado minimo solo con link
- **WHEN** el usuario pega "https://www.zara.com/.../pantalon" en la lista "Caprichos"
- **THEN** el sistema guarda el ojito con la URL normalizada, tienda detectada best-effort y estado pendiente

#### Scenario: URL invalida rechazada
- **WHEN** el usuario intenta guardar "pantalon zara" o un esquema no http(s)
- **THEN** el sistema rechaza con error de validacion y no crea el ojito

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

### Requirement: Enriquecimiento best-effort no bloqueante
El sistema SHALL intentar obtener titulo e imagen al guardar desde mas fuentes gratuitas presentes en el HTML (OpenGraph ampliado, Twitter Cards, image_src y JSON-LD) leyendo por tramos con corte temprano en paginas pesadas, SHALL conservar el motivo del fallo junto al estado y SHALL guardar igual el ojito si el fetch falla o expira, permitiendo correccion manual posterior.

#### Scenario: Preview conseguida
- **WHEN** la tienda expone OpenGraph y el fetch responde a tiempo
- **THEN** el sistema prerrellena titulo e imagen dejando edicion abierta

#### Scenario: Preview conseguida con fuente alternativa
- **WHEN** la tienda expone la imagen solo en `twitter:image` o JSON-LD y el fetch responde a tiempo
- **THEN** el sistema prerrellena titulo e imagen dejando edicion abierta

#### Scenario: Ficha pesada con metas al inicio
- **WHEN** la pagina supera el tope de descarga completa pero expone titulo e imagen en los primeros tramos (p. ej. ficha Primor de ~1.2MB con `og:image` en el byte 42 mil)
- **THEN** el sistema corta la lectura al conseguirlos y prerrellena titulo e imagen sin descargar la pagina entera

#### Scenario: Tienda bloquea el fetch
- **WHEN** el fetch falla, expira o es bloqueado por anti-bot (p. ej. 403 Cloudflare)
- **THEN** el sistema guarda el ojito solo con la URL y marca que la preview no esta disponible e indica que hay que introducir la imagen a mano

#### Scenario: Motivo del fallo conservado
- **WHEN** el fetch falla por cualquier causa (`too-large`, `http-403`, `timeout`...)
- **THEN** el sistema conserva el motivo junto al estado para poder diagnosticarlo despues

#### Scenario: Titulo legible sin entidades
- **WHEN** el titulo expuesto contiene entidades HTML (p. ej. `B&#xE1;lsamo`)
- **THEN** el sistema guarda el titulo decodificado (`Bálsamo`)

### Requirement: Marcar estado del ojito
El sistema SHALL permitir marcar cada ojito como pendiente o comprado y filtrar por estado dentro de la lista.

#### Scenario: Marcar comprado
- **WHEN** el usuario marca un ojito como comprado
- **THEN** el sistema actualiza su estado con fecha y lo excluye del filtro de pendientes
