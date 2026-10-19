# Política de seguridad de Ojito

## Reportar una vulnerabilidad

**No abras un issue público** para vulnerabilidades. Escríbenos por el canal
privado indicado en el perfil del repositorio (o contacta directamente a quien
mantiene el proyecto) incluyendo:

1. Descripción del problema y su impacto potencial.
2. Pasos para reproducirlo (sin incluir datos reales ni credenciales).
3. Versión/commit afectado y entorno (Node, SO).

Responderemos lo antes posible. Por favor, da un margen razonable para corregir
antes de divulgar públicamente (idealmente 90 días o hasta publicar el parche).

## Alcance

Este proyecto es un MVP local con:

- Auth propia (hash `scrypt`, sesiones Bearer opacas).
- SQLite local (`data.sqlite`).
- Fetch server-side de previews OpenGraph con protecciones básicas
  (timeout 6 s, tope 500 KB, máx. 3 redirects, bloqueo SSRF básico).

Queda **fuera de alcance**: ataques de denegación de servicio al MVP local,
ingeniería social y problemas de dependencias que ya tengan CVE con parche
disponible (actualízala por PR en ese caso).

## Higiene obligatoria para issues y PRs

**Nunca** incluyas en issues, PRs, comentarios o ficheros del repo:

- Contenidos de `data.sqlite` ni volcados de BD con datos reales.
- Ficheros `.env` ni valores de variables con secretos.
- Tokens de sesión (`tok_…`), contraseñas o hashes.
- URLs privadas, emails reales o datos personales de terceros.

Si publicaste algo sensible por error, avísanos de inmediato por el canal
privado para rotarlo y limpiar la historia.

## Versiones soportadas

Se da soporte de seguridad a la rama `main`. Al ser pre-1.0 en la práctica,
recomendamos mantener tu clon actualizado con `main`.
