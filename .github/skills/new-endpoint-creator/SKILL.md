---
name: new-endpoint-creator
description: Guía de arquitectura para crear nuevos endpoints en la API. Úsalo cuando se te pida añadir una nueva ruta, controlador o servicio al backend.
---

# 📡 API Endpoint Creation Standard

Este backend utiliza Node.js con Express y Sequelize, siguiendo una arquitectura en capas estricta: `Router -> Controller -> Service -> Model`.

Cuando crees un nuevo endpoint, sigue este flujo exacto:

1. **Router (`/server/routes/`):** Define la ruta y el método HTTP. 
   - Debes proteger la ruta inyectando el middleware de autenticación (`protect` o Passport JWT) si expone datos del usuario.
   - DEBES inyectar middlewares de validación (ej. Joi validator) para validar el `body` o los `params` antes de llegar al controlador.
2. **Controller (`/server/controllers/`):** - Su única responsabilidad es extraer los datos de la request (`req.body`, `req.user`, `req.params`), llamar al Service correspondiente, y retornar la respuesta HTTP o enviar el error al middleware global de manejo de errores (usando `next(error)`).
   - No pongas lógica de base de datos ni cálculos financieros aquí.
3. **Service (`/server/services/`):**
   - Aquí vive TODA la lógica de negocio.
   - IMPORTANTE: Siempre debes filtrar las consultas asegurándote de que la entidad (Cuenta, Transacción, Categoría) pertenezca al `req.user.id` (el usuario autenticado). Nunca confíes solo en el ID del recurso aportado en el Body.