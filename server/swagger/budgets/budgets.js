/**
 * @swagger
 * components:
 *   schemas:
 *     BudgetCreateRequest:
 *       type: object
 *       properties:
 *         categoryId:
 *           type: integer
 *           nullable: true
 *           description: Si es null, representa presupuesto global.
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *         currency:
 *           type: string
 *           example: USD
 *         period:
 *           type: string
 *           enum: [monthly]
 *           default: monthly
 *         month:
 *           type: string
 *           pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
 *           example: '2026-03'
 *       required: [amount, month]
 *
 *     BudgetUpdateRequest:
 *       type: object
 *       properties:
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *       required: [amount]
 *
 *     BudgetCategory:
 *       type: object
 *       nullable: true
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         icon:
 *           type: string
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *
 *     BudgetItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         categoryId:
 *           type: integer
 *           nullable: true
 *         amount:
 *           type: number
 *         currency:
 *           type: string
 *         period:
 *           type: string
 *         month:
 *           type: string
 *         category:
 *           $ref: '#/components/schemas/BudgetCategory'
 *
 *     BudgetStatusItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         category:
 *           $ref: '#/components/schemas/BudgetCategory'
 *         budgeted:
 *           type: number
 *         spent:
 *           type: number
 *         remaining:
 *           type: number
 *         percentageUsed:
 *           type: number
 *         currency:
 *           type: string
 *         period:
 *           type: string
 *         month:
 *           type: string
 *
 *     BudgetMutationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/BudgetItem'
 *
 *     BudgetListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BudgetItem'
 *
 *     BudgetStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BudgetStatusItem'
 */

/**
 * @swagger
 * /budgets:
 *   post:
 *     summary: Crear presupuesto del usuario autenticado
 *     tags: [Budgets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetCreateRequest'
 *     responses:
 *       201:
 *         description: Presupuesto creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetMutationResponse'
 *       400:
 *         description: Request inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Listar presupuestos configurados del usuario autenticado
 *     tags: [Budgets]
 *     parameters:
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
 *         description: Filtra por mes en formato YYYY-MM.
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *           enum: [monthly]
 *         description: Filtra por tipo de periodo.
 *     responses:
 *       200:
 *         description: Presupuestos obtenidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetListResponse'
 *       400:
 *         description: Request inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /budgets/status:
 *   get:
 *     summary: Estado de presupuestos del mes (gasto real vs presupuesto)
 *     tags: [Budgets]
 *     parameters:
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: string
 *           pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
 *         description: Mes objetivo en formato YYYY-MM. Si no se envía, usa el mes actual UTC.
 *     responses:
 *       200:
 *         description: Estado de presupuestos calculado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetStatusResponse'
 *       400:
 *         description: Request inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /budgets/{id}:
 *   patch:
 *     summary: Actualizar monto de presupuesto
 *     tags: [Budgets]
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
 *             $ref: '#/components/schemas/BudgetUpdateRequest'
 *     responses:
 *       200:
 *         description: Presupuesto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetMutationResponse'
 *       400:
 *         description: Request inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Eliminar presupuesto
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Presupuesto eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Request inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
