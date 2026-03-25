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
 *
 *     CategoryGroupCreate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 120
 *         type:
 *           type: string
 *           enum: [ingreso, gasto, neutral]
 *         analyticsBehavior:
 *           type: string
 *           enum: [include, exclude]
 *         analytics_behavior:
 *           type: string
 *           enum: [include, exclude]
 *       required: [name, type]
 *       anyOf:
 *         - required: [analyticsBehavior]
 *         - required: [analytics_behavior]
 *
 *     CategoryGroupUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 120
 *         type:
 *           type: string
 *           enum: [ingreso, gasto, neutral]
 *         analyticsBehavior:
 *           type: string
 *           enum: [include, exclude]
 *         analytics_behavior:
 *           type: string
 *           enum: [include, exclude]
 *
 *     CategoryGroupAssignCategories:
 *       type: object
 *       properties:
 *         categoryIds:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: integer
 *             minimum: 1
 *       required: [categoryIds]
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
 *   post:
 *     summary: Crear grupo de categorías del usuario autenticado
 *     tags: [Category Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryGroupCreate'
 *     responses:
 *       201:
 *         description: Grupo de categoría creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *       400:
 *         description: Request inválida
 *       500:
 *         description: Error interno del servidor
 *
 * /category-groups/{id}:
 *   patch:
 *     summary: Actualizar grupo de categoría del usuario autenticado
 *     tags: [Category Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryGroupUpdate'
 *     responses:
 *       200:
 *         description: Grupo de categoría actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 id:
 *                   type: integer
 *       400:
 *         description: Request inválida
 *       500:
 *         description: Error interno del servidor
 *   delete:
 *     summary: Eliminar grupo de categoría del usuario autenticado
 *     tags: [Category Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Grupo de categoría eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *       400:
 *         description: Request inválida
 *       409:
 *         description: No puedes borrar un grupo con categorías
 *       500:
 *         description: Error interno del servidor
 *
 * /category-groups/{id}/assign-categories:
 *   patch:
 *     summary: Asignar múltiples categorías a un grupo de categoría
 *     tags: [Category Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryGroupAssignCategories'
 *     responses:
 *       200:
 *         description: Categorías asignadas al grupo de categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 groupId:
 *                   type: integer
 *                 updatedCount:
 *                   type: integer
 *       400:
 *         description: Request inválida
 *       404:
 *         description: Grupo de categoría no encontrado
 *       500:
 *         description: Error interno del servidor
 */

module.exports = {};