# wish-lists Specification

## Purpose

Permite a cada usuario organizar los productos que desea en listas privadas agrupadas por ocasion (Navidad, Aniversario, Caprichos caros) y prepara el modelo para compartirlas en el futuro sin migraciones.

## Requirements

### Requirement: Crear lista privada de deseos
El sistema SHALL permitir a un usuario autenticado crear una lista privada con un nombre no vacio.

#### Scenario: Creacion correcta
- **WHEN** el usuario crea una lista con nombre "Regalos Navidad"
- **THEN** el sistema crea la lista, crea una pertenencia owner para ese usuario y la muestra en "mis listas"

#### Scenario: Nombre vacio rechazado
- **WHEN** el usuario intenta crear una lista sin nombre o solo con espacios
- **THEN** el sistema rechaza la operacion con un error de validacion y no crea nada

### Requirement: Ver solo las listas propias
El sistema SHALL mostrar a cada usuario unicamente las listas donde tiene pertenencia.

#### Scenario: Listado privado
- **WHEN** el usuario abre "mis listas"
- **THEN** el sistema devuelve solo sus listas ordenadas por actualizacion reciente y ninguna de otros usuarios

### Requirement: Renombrar, archivar y eliminar listas
El sistema SHALL permitir al owner renombrar, archivar y eliminar sus listas.

#### Scenario: Renombrar lista
- **WHEN** el owner renombra "Navidad" a "Regalos Navidad 2026"
- **THEN** el sistema actualiza el nombre y mantiene sus ojitos y pertenencias

#### Scenario: Eliminar lista con contenido
- **WHEN** el owner elimina una lista que contiene ojitos
- **THEN** el sistema elimina la lista y sus ojitos asociados tras confirmacion

### Requirement: Acceso restringido a miembros con modelo share-ready
El sistema SHALL restringir todo acceso a una lista a sus miembros y SHALL crear toda lista nueva con visibilidad privada y un unico miembro owner, sin exponer `user_id` directo en Lista.

#### Scenario: Acceso denegado a no miembro
- **WHEN** un usuario sin pertenencia intenta leer o modificar una lista ajena
- **THEN** el sistema lo deniega como no encontrado o no autorizado sin filtrar datos

#### Scenario: Lista nueva lista para compartir futuro
- **WHEN** se crea una lista en v1
- **THEN** existe una fila de pertenencia owner, `created_by` queda registrado y anadir miembros en v2 no requiere migracion
