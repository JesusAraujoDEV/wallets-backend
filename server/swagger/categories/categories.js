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
 *         includeInStats:
 *           type: boolean
 *           description: Si la categoría participa en estadísticas
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
 *         includeInStats:
 *           type: boolean
 *           default: true
 *       required: [name, type]
 *     CategoryUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [income, expense, ingreso, gasto]
 *         includeInStats:
 *           type: boolean
 *
 *     CategoryIdsPayload:
 *       type: object
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: integer
 *       required: [ids]
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Listar categorías del usuario
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: includeInStats
 *         schema:
 *           type: string
 *           enum: ['true','false','1','0']
 *         description: Filtrar por includeInStats (true/false)
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
 *
 * /categories/include-in-stats/enable:
 *   post:
 *     summary: Activar include_in_stats para múltiples categorías
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryIdsPayload'
 *     responses:
 *       200:
 *         description: Actualización realizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 rowCount: { type: integer }
 *
 * /categories/include-in-stats/disable:
 *   post:
 *     summary: Desactivar include_in_stats para múltiples categorías
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryIdsPayload'
 *     responses:
 *       200:
 *         description: Actualización realizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 rowCount: { type: integer }

 * /categories/include-in-stats/enabled:
 *   get:
 *     summary: Listar categorías con include_in_stats = true
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías incluidas en estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'

 * /categories/include-in-stats/disabled:
 *   get:
 *     summary: Listar categorías con include_in_stats = false
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Lista de categorías excluidas de estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

module.exports = {};
