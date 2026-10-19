# responsive-ui Specification

## Purpose

Define el comportamiento responsive mobile-first y de estilo de Ojito para que toda la app sea usable con una sola mano en móvil y escale sin roturas hasta escritorio.

## Requirements

### Requirement: Base mobile-first sin scroll horizontal
The system SHALL renderizar toda vista sin scroll horizontal a 360px, apilando contenido en una columna con la base diseñada para 360–375px.

#### Scenario: Vista móvil estrecha sin desborde
- **WHEN** el usuario abre cualquier vista a 360px de ancho
- **THEN** no existe scroll horizontal y el contenido se apila verticalmente sin elementos recortados

#### Scenario: Escalado a escritorio
- **WHEN** el viewport crece a 768/1024/1440px
- **THEN** el layout expande columnas y max-width sin saltos ni solapamientos

### Requirement: Adaptación de layouts por breakpoint
The system SHALL adaptar cabeceras, formularios inline y rejilla masonry a cada breakpoint (1 columna ≤480px, 2–3 columnas en escritorio).

#### Scenario: Masonry a una columna en móvil
- **WHEN** el usuario ve la rejilla de ojitos a ≤480px
- **THEN** las tarjetas se muestran en una sola columna con separación legible

#### Scenario: Formularios y cabeceras que envuelven
- **WHEN** el usuario crea listas u ojitos en móvil
- **THEN** inputs y botones ocupan ancho completo o envuelven sin comprimirse ni salirse

### Requirement: Interacción táctil y legibilidad
The system SHALL ofrecer targets táctiles ≥44px, texto base ≥16px y espaciado ≥8px sin elementos clicables apiñados.

#### Scenario: Acciones pulsables con el pulgar
- **WHEN** el usuario toca chips, botones y acciones de tarjeta en móvil
- **THEN** cada target mide al menos 44px y hay separación suficiente para no fallar el toque

#### Scenario: Texto legible sin zoom
- **WHEN** el usuario lee títulos, notas y formularios en móvil
- **THEN** el cuerpo parte de 16px y el contraste permite leer sin zoom

### Requirement: Consistencia visual sin patrones genéricos
The system SHALL mantener los tokens cálidos y la tipografía editorial existentes y SHALL evitar patrones genéricos (Inter-only, degradados morado-azul, cards-in-cards, gris sobre color, brillos, bounce).

#### Scenario: Identidad cálida preservada
- **WHEN** el usuario navega entre auth, listas y detalle
- **THEN** colores, radios y tipografías son coherentes con el sistema `--paper/--ink/--accent/--blush` existente

#### Scenario: Sin apariencia de plantilla genérica
- **WHEN** se revisa visualmente cualquier vista
- **THEN** no aparecen los anti-patrones prohibidos y los iconos usan SVG, no emojis

### Requirement: Accesibilidad y rendimiento móvil
The system SHALL cumplir contraste 4.5:1 en texto, respetar `prefers-reduced-motion` y optimizar media con `loading=lazy`, `srcset` donde aplique y máximo 2 familias de fuentes con `display=swap`.

#### Scenario: Contraste y movimiento reducido
- **WHEN** se mide contraste de texto y el usuario activa reducir movimiento
- **THEN** el contraste es ≥4.5:1 y no hay animaciones ni transiciones no esenciales

#### Scenario: Carga ligera en móvil
- **WHEN** la rejilla carga imágenes en conexión móvil
- **THEN** las imágenes usan lazy-load y fuentes limitadas sin bloquear el render
