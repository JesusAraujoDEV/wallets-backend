---
name: db-migration-handler
description: Reglas para modificar modelos de Sequelize o crear nuevas migraciones de base de datos en PostgreSQL.
---

# 🗄️ Database & Sequelize Guidelines

Cuando se te pida modificar un modelo de datos o crear una migración (`sequelize-cli`), presta extrema atención a mantener la consistencia, ya que hemos detectado deuda técnica en el pasado.

1. **Sincronía Modelo vs Migración:** Asegúrate de que las definiciones en la carpeta `/server/models/` coincidan EXACTAMENTE con los archivos generados en `/server/migrations/`.
   - Si añades `allowNull: false` en un modelo, la migración DEBE reflejar esa misma restricción a nivel de PostgreSQL.
2. **Relaciones (Asociaciones):**
   - El sistema es multi-usuario. Casi todas las entidades principales (`accounts`, `categories`, `transactions`) pertenecen a un único `user_id`.
   - Verifica que las llaves foráneas (`FK`) estén correctamente definidas con sus comportamientos `ON DELETE` (usualmente `CASCADE` o `RESTRICT` dependiendo de la regla de negocio, evita `SET NULL` en transacciones).
3. **Índices:** Si añades una restricción `unique` en el modelo (ej. `email` o `username`), asegúrate de crear el índice único explícitamente en el archivo de migración.