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
El sistema SHALL permitir ver y editar titulo, tienda, imagen, precio, nota y URL de cada ojito propio.

#### Scenario: Edicion manual tras fallo de preview
- **WHEN** el usuario edita titulo a "Tonico Primor" y sube nota "piel sensible"
- **THEN** el sistema persiste los cambios y los muestra en la ficha

### Requirement: Enriquecimiento best-effort no bloqueante
El sistema SHALL intentar obtener titulo e imagen al guardar y SHALL guardar igual el ojito si el fetch falla o expira, permitiendo correccion manual posterior.

#### Scenario: Preview conseguida
- **WHEN** la tienda expone OpenGraph y el fetch responde a tiempo
- **THEN** el sistema prerrellena titulo e imagen dejando edicion abierta

#### Scenario: Tienda bloquea el fetch
- **WHEN** el fetch falla, expira o es bloqueado por anti-bot
- **THEN** el sistema guarda el ojito solo con la URL y marca que la preview no esta disponible

### Requirement: Marcar estado del ojito
El sistema SHALL permitir marcar cada ojito como pendiente o comprado y filtrar por estado dentro de la lista.

#### Scenario: Marcar comprado
- **WHEN** el usuario marca un ojito como comprado
- **THEN** el sistema actualiza su estado con fecha y lo excluye del filtro de pendientes
