# Spec Delta

## MODIFIED Requirements

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
