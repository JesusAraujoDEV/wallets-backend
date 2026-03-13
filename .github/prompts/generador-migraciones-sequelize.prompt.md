---
name: generador-migraciones-sequelize
description: "Generar migraciones Sequelize exactas para PostgreSQL a partir de codigo de modelo"
argument-hint: "codigo_modelo: pega el modelo Sequelize completo para crear la migracion"
agent: agent
---

Tu tarea es generar el archivo de migracion exacto para PostgreSQL usando Sequelize, a partir del codigo de un modelo Sequelize.

Parametro de entrada obligatorio:
- codigo_modelo

Regla de entrada:
- Si no recibes codigo_modelo, no generes migracion y solicita ese parametro.

Instrucciones obligatorias (estrictas):
1. Las reglas de allowNull y unique deben coincidir perfectamente entre el modelo y la migracion.
2. Debes definir correctamente todas las llaves foraneas (foreign keys), incluyendo sus reglas ON DELETE y ON UPDATE.
3. Debes incluir ambos metodos: up (aplicar) y down (revertir limpiamente).

Requisitos tecnicos obligatorios:
- El resultado debe ser un archivo de migracion Sequelize valido para PostgreSQL.
- No dejes pseudocodigo, TODOs ni placeholders.
- Incluye tipos de datos, defaults, indices y restricciones relevantes cuando existan en codigo_modelo.
- Si el modelo usa referencias, la migracion debe reflejarlas de forma explicita en references, onDelete y onUpdate.
- El metodo down debe revertir completamente lo creado en up sin dejar residuos.
- Si detectas ambiguedad en codigo_modelo, declara supuestos minimos antes del codigo.

Formato de salida requerido:
1. Supuestos minimos (solo si aplica).
2. Nombre sugerido del archivo de migracion.
3. Codigo completo del archivo de migracion (module.exports con up y down).
4. Checklist de validacion contra las 3 instrucciones obligatorias.

Entrada recibida:
- codigo_modelo: {{codigo_modelo}}
