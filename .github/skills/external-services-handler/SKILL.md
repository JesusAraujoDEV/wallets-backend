---
name: external-services-handler
description: Reglas para integrar servicios de terceros (como SMTP) y gestionar variables de entorno de forma segura y consistente en el backend.
argument-hint: Que servicio externo se integra, que variables env se usan y desde que controlador se invoca
---

# External Services Handler

## Objetivo
Estandarizar la integracion de servicios de terceros (por ejemplo SMTP) para evitar credenciales hardcodeadas, reducir riesgos de seguridad y asegurar enlaces dinamicos confiables en correos.

## Cuando usar
- Crear una nueva integracion con un proveedor externo (SMTP, API externa, webhook, etc.)
- Editar una integracion externa existente
- Agregar o modificar envio de correos con enlaces dinamicos
- Cambiar manejo de variables de entorno para servicios de terceros

## Reglas obligatorias
1. Todo servicio externo debe vivir en su propio archivo dentro de `/server/services/`.
   - Ejemplo: `mailer_service.js`
2. NUNCA hardcodear credenciales o secretos.
   - Siempre usar `process.env` (ejemplo: `SMTP_USER`, `SMTP_PASS`).
3. Para enlaces dinamicos en correos, el controlador debe:
   - Extraer `req.headers.origin` o `req.headers.referer`
   - Validar ese origen contra `process.env.FRONTEND_URLS` (lista separada por comas)
   - Pasar el origen validado al servicio de correos
   - Si no coincide con la lista, usar el primer dominio de `FRONTEND_URLS` como fallback de seguridad

## Flujo obligatorio
1. Crear o ubicar el servicio externo en `/server/services/`:
   - Un archivo por integracion
   - Sin logica HTTP del controlador dentro del servicio
2. Definir y usar variables de entorno:
   - Identificar todas las credenciales/config requeridas por el proveedor
   - Referenciarlas unicamente via `process.env`
   - Si falta una variable critica, fallar con error controlado y mensaje claro
3. En el controlador, resolver origen para enlaces:
   - Obtener `originCandidate` desde `req.headers.origin` o `req.headers.referer`
   - Parsear `process.env.FRONTEND_URLS` por comas y normalizar (trim)
   - Validar coincidencia exacta de dominio permitido
   - Elegir `validatedOrigin`:
     - Si hay match: usar origen solicitado
     - Si no hay match: usar primer dominio permitido
4. Llamar al servicio externo pasando parametros seguros:
   - Incluir `validatedOrigin` para construir enlaces
   - No pasar secretos al cliente ni a respuestas HTTP
5. Manejo de errores:
   - Capturar errores del proveedor externo
   - Propagar error al middleware global con mensaje seguro (sin exponer secretos)

## Decisiones y ramas
- Si `FRONTEND_URLS` esta vacio o no definido:
  - Tratarlo como error de configuracion y no enviar correo hasta corregir entorno
- Si `origin` no viene en headers pero `referer` si:
  - Intentar validar `referer` como origen candidato
- Si vienen ambos (`origin` y `referer`):
  - Priorizar `origin` y usar `referer` solo como respaldo
- Si el origen trae path/query:
  - Normalizar y validar solo contra el dominio permitido

## Criterios de calidad
- Existe archivo dedicado del servicio en `/server/services/`
- No hay credenciales hardcodeadas en codigo fuente
- Se usan variables `process.env` para secretos y configuracion
- El controlador valida origen contra `FRONTEND_URLS`
- Se aplica fallback seguro al primer dominio permitido
- El servicio recibe y usa el origen validado para enlaces dinamicos
- Los errores no filtran secretos ni credenciales

## Definition of Done
- Integracion externa implementada o actualizada en archivo dedicado de `/server/services/`
- Variables de entorno requeridas identificadas y usadas
- Flujo de validacion de origen implementado en controlador
- Fallback de seguridad operativo cuando no hay match
- Servicio invocado con origen validado para construir enlaces
- Manejo de errores seguro confirmado
