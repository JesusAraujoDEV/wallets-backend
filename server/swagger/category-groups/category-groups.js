/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryGroup:
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
 *         userId:
 *           type: integer
 *       required: [id, name, type, analyticsBehavior, userId]
 */

/**
 * @swagger
 * /category-groups:
 *   get:
 *     summary: Listar grupos de categorías del usuario autenticado
 *     tags: [Category Groups]
 *     responses:
 *       200:
 *         description: Lista de grupos de categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryGroup'
 *       400:
 *         description: Request inválida
 *       500:
 *         description: Error interno del servidor
 */

module.exports = {};