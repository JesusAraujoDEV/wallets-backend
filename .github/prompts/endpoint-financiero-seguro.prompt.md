---
name: endpoint-financiero-seguro
description: "Crear Controller y Service completos para una ruta financiera segura en Express.js + Sequelize"
argument-hint: "descripcion_ruta: describe la nueva ruta (objetivo, método HTTP, inputs, reglas y respuesta esperada)"
agent: agent
---

Tu tarea es generar el codigo completo de Controller y Service para Express.js + Sequelize a partir de una idea de ruta financiera.

Parametro de entrada obligatorio:
- descripcion_ruta

Regla de entrada:
- Si no recibes el parametro descripcion_ruta, no generes codigo. Solicita primero ese parametro.

Instrucciones obligatorias (no negociables):
1. Validar siempre que el recurso pertenezca al usuario autenticado usando req.user.id.
2. Envolver cualquier mutacion de base de datos (create, update, delete, transferencias, ajustes de saldo) dentro de sequelize.transaction().
3. Manejar errores con try/catch y propagarlos al middleware global usando next(error).
4. Estandarizar todas las respuestas en JSON con la forma:
   {
     "success": true|false,
     "message": "texto claro",
     "data": {},
     "meta": {}
   }

Al generar la solucion, entrega exactamente:
- Controller completo (imports, funciones, export).
- Service completo (imports, funciones, export).

Requisitos de implementacion:
- No dejar pseudocodigo ni TODOs.
- Usar nombres de funciones claros alineados con descripcion_ruta.
- Incluir validaciones de pertenencia antes de operar sobre recursos sensibles.
- En operaciones de lectura sensibles, filtrar por user_id asociado a req.user.id.
- En operaciones de escritura, usar el objeto transaction en todas las consultas involucradas.
- Mantener compatibilidad con middleware de errores de Express (next(error)).

Formato de salida requerido:
1. Supuestos minimos derivados de descripcion_ruta (si aplica).
2. Archivo Controller.
3. Archivo Service.
4. Breve checklist de cumplimiento contra las 4 instrucciones obligatorias.

Entrada recibida:
- descripcion_ruta: {{descripcion_ruta}}
