/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryGroupRef:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ingreso, gasto, neutral]
 *         analyticsBehavior:
 *           type: string
 *           enum: [include, exclude]
 *       required: [id, name, type, analyticsBehavior]
 *
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ingreso, gasto]
 *         groupId:
 *           type: integer
 *           nullable: true
 *         group:
 *           $ref: '#/components/schemas/CategoryGroupRef'
 *         icon:
 *           type: string
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         colorName:
 *           type: string
 *           nullable: true
 *         isSystem:
 *           type: boolean
 *         userId:
 *           type: integer
 *       required: [id, name, type, userId]
 *
 *     CategoryCreate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [income, expense, ingreso, gasto]
 *         groupId:
 *           type: integer
 *           nullable: true
 *         icon:
 *           type: string
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         colorName:
 *           type: string
 *           nullable: true
 *       required: [name, type]
 *
 *     CategoryUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [income, expense, ingreso, gasto]
 *         groupId:
 *           type: integer
 *           nullable: true
 *         icon:
 *           type: string
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         colorName:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Listar categorías del usuario
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Filtrar por grupo de categoría
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ['income','expense','ingreso','gasto']
 *         description: Filtrar por tipo de categoría
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 *
 *   post:
 *     summary: Crear una nueva categoría
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryCreate'
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 *
 *   patch:
 *     summary: Actualizar categoría (parcial)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryUpdate'
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 *
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eliminación exitosa
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */

module.exports = {};
