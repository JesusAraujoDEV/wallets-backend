/**
 * @swagger
 * components:
 *   schemas:
 *     DebtCreateRequest:
 *       type: object
 *       required: [type, contactName, totalAmount]
 *       properties:
 *         type:
 *           type: string
 *           enum: [payable, receivable]
 *           description: "payable = Yo debo, receivable = Me deben"
 *         contactName:
 *           type: string
 *           maxLength: 255
 *           description: Nombre del contacto (a quién le debo o quién me debe)
 *         description:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *         totalAmount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *         currency:
 *           type: string
 *           default: USD
 *           example: USD
 *         dueDate:
 *           type: string
 *           format: date
 *           nullable: true
 *           example: '2026-06-30'
 *         categoryId:
 *           type: integer
 *           nullable: true
 *           description: Categoría asociada a la deuda (ej. "Carro"). Se usa como fallback en pagos.
 *
 *     DebtUpdateRequest:
 *       type: object
 *       properties:
 *         contactName:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *         dueDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         totalAmount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *         categoryId:
 *           type: integer
 *           nullable: true
 *           description: Categoría asociada a la deuda
 *
 *     DebtPayRequest:
 *       type: object
 *       required: [amount, currency, accountId, date]
 *       properties:
 *         amount:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *         currency:
 *           type: string
 *           example: USD
 *         accountId:
 *           type: integer
 *         date:
 *           type: string
 *           format: date
 *           example: '2026-03-30'
 *         categoryId:
 *           type: integer
 *           nullable: true
 *           description: Categoría opcional. Si no se envía, usa la de la deuda o una por defecto.
 *
 *     LinkTransactionsRequest:
 *       type: object
 *       required: [transactionIds]
 *       properties:
 *         transactionIds:
 *           type: array
 *           items:
 *             type: integer
 *           minItems: 0
 *           maxItems: 100
 *           description: >
 *             IDs de las transacciones que deben quedar vinculadas a esta deuda (sync).
 *             Las que estaban vinculadas pero no aparecen en el array serán desvinculadas.
 *             Enviar array vacío desvincula todas las transacciones.
 *           example: [10, 23, 45]
 *
 *     LinkTransactionsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             linkedCount:
 *               type: integer
 *               description: Cantidad total de transacciones vinculadas tras la sincronización
 *             linkedTransactionIds:
 *               type: array
 *               items:
 *                 type: integer
 *               description: IDs finales de las transacciones vinculadas
 *             unlinkedCount:
 *               type: integer
 *               description: Cantidad de transacciones que fueron desvinculadas en esta operación
 *             debt:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                 totalAmount:
 *                   type: number
 *                 paidAmount:
 *                   type: number
 *                   description: Monto pagado recalculado con lógica multimoneda
 *                 remaining:
 *                   type: number
 *
 *     DebtItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [payable, receivable]
 *         contactName:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         totalAmount:
 *           type: number
 *         currency:
 *           type: string
 *         dueDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         categoryId:
 *           type: integer
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [pending, partial, paid]
 *         paidAmount:
 *           type: number
 *         remaining:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     DebtPayResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             debt:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 status:
 *                   type: string
 *                 totalAmount:
 *                   type: number
 *                 paidAmount:
 *                   type: number
 *                 remaining:
 *                   type: number
 *             transaction:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 description:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date
 *                 debtId:
 *                   type: integer
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /debts:
 *   get:
 *     summary: Listar deudas del usuario autenticado
 *     tags: [Debts]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, partial, paid]
 *         description: Filtrar por estado de la deuda
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [payable, receivable]
 *         description: Filtrar por tipo de deuda
 *     responses:
 *       200:
 *         description: Deudas obtenidas correctamente
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DebtItem'
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
 *   post:
 *     summary: Crear una nueva deuda
 *     tags: [Debts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DebtCreateRequest'
 *     responses:
 *       201:
 *         description: Deuda creada correctamente
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
 *                   $ref: '#/components/schemas/DebtItem'
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
 * /debts/{id}:
 *   patch:
 *     summary: Actualizar información básica de una deuda
 *     tags: [Debts]
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
 *             $ref: '#/components/schemas/DebtUpdateRequest'
 *     responses:
 *       200:
 *         description: Deuda actualizada correctamente
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
 *                   $ref: '#/components/schemas/DebtItem'
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
 *       404:
 *         description: Deuda no encontrada
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
 *   delete:
 *     summary: Eliminar una deuda (desvincula transacciones, no las borra)
 *     tags: [Debts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deuda eliminada correctamente
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
 *       404:
 *         description: Deuda no encontrada
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
 * /debts/{id}/pay:
 *   post:
 *     summary: Abonar a una deuda (crea transacción real vinculada)
 *     tags: [Debts]
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
 *             $ref: '#/components/schemas/DebtPayRequest'
 *     responses:
 *       201:
 *         description: Abono registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DebtPayResponse'
 *       400:
 *         description: Request inválido o fondos insuficientes
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
 *       404:
 *         description: Deuda no encontrada
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
 * /debts/{id}/link-transactions:
 *   post:
 *     summary: Sincronizar transacciones vinculadas a una deuda
 *     tags: [Debts]
 *     description: >
 *       Comportamiento de SYNC: el array enviado representa el estado deseado de vinculación.
 *       Las transacciones que estaban vinculadas pero no aparecen en el array serán desvinculadas (debt_id = NULL).
 *       Las nuevas del array que tengan debt_id = NULL serán vinculadas.
 *       Las que ya estén vinculadas a OTRA deuda se ignoran.
 *       El paidAmount se recalcula con lógica multimoneda (usa amount_usd cuando la moneda difiere).
 *       Enviar array vacío desvincula todas las transacciones de la deuda.
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
 *             $ref: '#/components/schemas/LinkTransactionsRequest'
 *     responses:
 *       200:
 *         description: Transacciones vinculadas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinkTransactionsResponse'
 *       400:
 *         description: Request inválido o ninguna transacción válida para vincular
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
 *       404:
 *         description: Deuda no encontrada
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
