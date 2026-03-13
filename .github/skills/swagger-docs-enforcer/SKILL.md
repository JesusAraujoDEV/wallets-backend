---
name: swagger-docs-enforcer
description: 'ENFORCER SKILL para Swagger/OpenAPI en backend Express. Úsalo SIEMPRE que se cree, edite o elimine un endpoint, controlador o ruta. Obliga a actualizar documentación OpenAPI con método, parámetros, body y respuestas 200/400/500 antes de dar la tarea por terminada.'
argument-hint: 'Qué cambio de endpoint/controlador/ruta se hizo y qué archivo Swagger se actualizó'
---

# Swagger Docs Enforcer

## Objetivo
Garantizar que cualquier cambio de API en el backend quede reflejado en Swagger/OpenAPI en el mismo flujo de trabajo.

## Cuándo usar
- Crear endpoint nuevo
- Editar endpoint existente
- Eliminar endpoint existente
- Crear, editar o eliminar controlador que impacte contrato HTTP
- Crear, editar o eliminar rutas (`/server/routes/`) o schemas que cambien request/response

## Regla obligatoria
No se considera terminada una tarea de backend API hasta que la documentación Swagger/OpenAPI esté actualizada y validada.

## Flujo obligatorio
1. Identificar el cambio de contrato HTTP:
   - Método (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
   - Path
   - Parámetros (`path`, `query`, `headers`)
   - Body esperado
   - Códigos de respuesta
2. Localizar archivo(s) de documentación Swagger/OpenAPI:
   - Buscar primero rutas evidentes del proyecto (por ejemplo `server/swagger/`, `swagger/`, `docs/`).
   - Si no se encuentra ubicación clara, buscar obligatoriamente en `server/docs`.
   - Si tampoco está, buscar obligatoriamente en `server/middlewares`.
   - No cerrar tarea si no se completó esta búsqueda.
3. Actualizar Swagger/OpenAPI según el cambio:
   - Agregar/editar/eliminar operación del endpoint
   - Documentar método y path correctos
   - Documentar parámetros esperados
   - Documentar body de request (si aplica)
   - Documentar respuestas mínimas:
     - `200` (éxito)
     - `400` (error de validación o request inválido)
     - `500` (error interno)
4. Verificar consistencia:
   - La ruta documentada coincide con el router real
   - El schema/documentación de request coincide con validaciones reales
   - Los códigos de estado documentados coinciden con comportamiento del controlador/servicio
5. Cerrar con evidencia:
   - Indicar archivo(s) Swagger/OpenAPI modificados
   - Resumir qué endpoint cambió y qué se documentó

## Decisiones y ramas
- Si el endpoint no usa body (ej. `GET` o `DELETE`): documentar explícitamente que no aplica body.
- Si hay múltiples archivos Swagger por módulo: actualizar todos los afectados.
- Si se elimina endpoint/controlador/ruta: remover también la entrada Swagger correspondiente para evitar documentación huérfana.

## Criterios de calidad
- Método y path exactos
- Parámetros completos y coherentes
- Body definido cuando aplica
- Respuestas `200`, `400`, `500` presentes
- Sin operaciones obsoletas luego de eliminaciones
- Trazabilidad clara entre código API y contrato documentado

## Definition of Done
- Cambio de backend implementado
- Swagger/OpenAPI actualizado en los archivos correctos
- Incluye método, parámetros, body (si aplica) y respuestas `200`, `400`, `500`
- Se reportan archivos de documentación actualizados
- Si la ubicación de Swagger era incierta, se confirma búsqueda en `server/docs` y `server/middlewares`
