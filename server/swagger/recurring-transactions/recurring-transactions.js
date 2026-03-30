/**
 * @swagger
 * components:
 *   schemas:
 *     RecurringTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         accountId:
 *           type: integer
 *           nullable: true
 *         categoryId:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [ingreso, gasto]
 *         amount:
 *           type: string
 *           description: Monto decimal serializado
 *         currency:
 *           type: string
 *           pattern: '^[A-Z]{3}$'
 *           default: USD
 *         description:
 *           type: string
 *         frequency:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *         startDate:
 *           type: string
 *           format: date
 *         nextDate:
 *           type: string
 *           format: date
 *         executionMode:
 *           type: string
 *           enum: [auto, manual]
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     RecurringTransactionCreateRequest:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [ingreso, gasto]
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *         currency:
 *           type: string
 *           pattern: '^[A-Z]{3}$'
 *           default: USD
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         frequency:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *         startDate:
 *           type: string
 *           format: date
 *         accountId:
 *           type: integer
 *           nullable: true
 *         categoryId:
 *           type: integer
 *         executionMode:
 *           type: string
 *           enum: [auto, manual]
 *           default: manual
 *         isActive:
 *           type: boolean
 *           default: true
 *       required: [type, amount, description, frequency, startDate, categoryId]
 *     RecurringTransactionUpdateRequest:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [ingreso, gasto]
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *         currency:
 *           type: string
 *           pattern: '^[A-Z]{3}$'
 *         description:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         frequency:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *         startDate:
 *           type: string
 *           format: date
 *         accountId:
 *           type: integer
 *           nullable: true
 *         categoryId:
 *           type: integer
 *         executionMode:
 *           type: string
 *           enum: [auto, manual]
 *         isActive:
 *           type: boolean
 *     RecurringTriggerResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         processedCount:
 *           type: integer
 *           example: 2
 *         message:
 *           type: string
 *           example: Suscripciones procesadas
 */

/**
 * @swagger
 * /recurring-transactions:
 *   post:
 *     summary: Crear transaccion recurrente
 *     tags: [Recurring Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecurringTransactionCreateRequest'
 *     responses:
 *       201:
 *         description: Transaccion recurrente creada
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
 *                   $ref: '#/components/schemas/RecurringTransaction'
 *       400:
 *         description: Request invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token invalido
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
 *     summary: Listar transacciones recurrentes del usuario autenticado
 *     tags: [Recurring Transactions]
 *     responses:
 *       200:
 *         description: Lista de recurrencias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecurringTransaction'
 *       400:
 *         description: Request invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token invalido
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
 * /recurring-transactions/{id}:
 *   patch:
 *     summary: Actualizar transaccion recurrente
 *     tags: [Recurring Transactions]
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
 *             $ref: '#/components/schemas/RecurringTransactionUpdateRequest'
 *     responses:
 *       200:
 *         description: Transaccion recurrente actualizada
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
 *                   $ref: '#/components/schemas/RecurringTransaction'
 *       400:
 *         description: Request invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token invalido
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
 *     summary: Eliminar transaccion recurrente
 *     tags: [Recurring Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaccion recurrente eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Request invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token invalido
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
 * /recurring-transactions/trigger:
 *   post:
 *     summary: Ejecutar manualmente el procesamiento de suscripciones del usuario actual
 *     tags: [Recurring Transactions]
 *     description: Endpoint de prueba manual para frontend. No requiere body.
 *     responses:
 *       200:
 *         description: Suscripciones procesadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurringTriggerResponse'
 *       400:
 *         description: Request invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token invalido
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
 * /recurring-transactions/{id}/pay-now:
 *   post:
 *     summary: Adelantar pago de una suscripcion recurrente
 *     tags: [Recurring Transactions]
 *     description: Crea una transaccion real con los datos de la suscripcion y avanza la fecha de proximo cobro (nextDate).
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
 *             type: object
 *             properties:
 *               accountId:
 *                 type: integer
 *                 description: Cuenta a la que se aplica el pago
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Monto del pago (si no se envia, usa el de la suscripcion)
 *               currency:
 *                 type: string
 *                 pattern: '^[A-Z]{3}$'
 *                 description: Moneda del pago (ej VES, USD, EUR). Si no se envia, usa la de la suscripcion
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha del pago (por defecto hoy)
 *             required: [accountId]
 *     responses:
 *       200:
 *         description: Pago adelantado registrado
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
 *                   $ref: '#/components/schemas/RecurringTransaction'
 *       400:
 *         description: Request invalido (suscripcion inactiva, fondos insuficientes, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Suscripcion no encontrada
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
