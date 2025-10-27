/**
 * @swagger
 * components:
 *   schemas:
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
 *         userId:
 *           type: integer
 *       required: [id, name, type]
 *     CategoryCreate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [income, expense, ingreso, gasto]
 *       required: [name, type]
 *     CategoryUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [income, expense, ingreso, gasto]
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Listar categorías del usuario
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
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
 *               $ref: '#/components/schemas/Category'
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
 */

module.exports = {};
