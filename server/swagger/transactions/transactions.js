/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         description:
 *           type: string
 *         amount:
 *           type: string
 *           description: Monto en la moneda original (string decimal)
 *         currency:
 *           type: string
 *           enum: [VES, USD]
 *         amountUsd:
 *           type: string
 *           description: Monto convertido a USD (string decimal)
 *         exchangeRateUsed:
 *           type: string
 *           description: Tasa usada cuando currency=VES
 *         date:
 *           type: string
 *           format: date
 *         categoryId:
 *           type: integer
 *         accountId:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [ingreso, gasto]
 *           description: Tipo de la categoría asociada
 *       required: [id, description, amount, currency, date, categoryId, accountId]
 *     GroupedTransactionsResponse:
 *     TransferRequest:
 *       type: object
 *       properties:
 *         fromAccountId:
 *           type: integer
 *           description: ID de la cuenta origen
 *         toAccountId:
 *           type: integer
 *           description: ID de la cuenta destino
 *         amount:
 *           type: number
 *           format: float
 *           description: Monto a transferir
 *         commission:
 *           type: number
 *           format: float
 *           description: Comisión de la transferencia (se registrará como gasto aparte)
 *           default: 0
 *         date:
 *           type: string
 *           format: date
 *           description: Fecha de la transferencia (YYYY-MM-DD)
 *         concept:
 *           type: string
 *           description: Concepto opcional para describir la transferencia
 *       required: [fromAccountId, toAccountId, amount, date]
 *     TransferResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *         transfer:
 *           type: object
 *           properties:
 *             outTx:
 *               $ref: '#/components/schemas/Transaction'
 *             inTx:
 *               $ref: '#/components/schemas/Transaction'
 *             commissionTx:
 *               nullable: true
 *               allOf:
 *                 - $ref: '#/components/schemas/Transaction'
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *         hasMore:
 *           type: boolean
 *         nextCursorDate:
 *           type: string
 *           format: date
 *           nullable: true
 *
 * tags:
 *   - name: Transactions
 *     description: Operaciones sobre transacciones
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Listar transacciones (opcionalmente agrupadas por día)
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: grouped
 *         schema:
 *           type: string
 *           enum: ['0','1']
 *         description: "Usa '1' para agrupar por día y paginar por días"
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 20
 *         description: Tamaño de página (solo cuando grouped=1)
 *       - in: query
 *         name: cursorDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Límite superior exclusivo para paginar hacia atrás (solo grouped=1)
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda en descripción y nombre de categoría
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filtro por tipo de categoría (se mapea a ingreso/gasto)
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: IDs de categorías separados por coma, ej. "5,14,23"
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: IDs de cuentas separados por coma, ej. "31,32"
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Día exacto a filtrar (si no se envía rango o mes)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial (inclusive) para rango
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final (inclusive) para rango
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *         example: "2025-09"
 *         description: Mes a filtrar en formato YYYY-MM (si no hay dateFrom/dateTo)
 *     responses:
 *       200:
 *         description: Lista de transacciones o respuesta agrupada por día
 *         content:
 *           application/json:
 *             oneOf:
 *               - type: array
 *                 items:
 *                   $ref: '#/components/schemas/Transaction'
 *               - $ref: '#/components/schemas/GroupedTransactionsResponse'
 *   post:
 *     summary: Crear una transacción simple
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [VES, USD]
 *               date:
 *                 type: string
 *                 format: date
 *               categoryId:
 *                 type: integer
 *               accountId:
 *                 type: integer
 *             required: [description, amount, currency, date, categoryId, accountId]
 *     responses:
 *       201:
 *         description: Transacción creada
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error del servidor
 *
 * /transactions/transfer:
 *   post:
 *     summary: Crear una transferencia entre cuentas (genera 2 movimientos y 1 gasto de comisión opcional)
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *           example:
 *             fromAccountId: 1
 *             toAccountId: 2
 *             amount: 400
 *             commission: 10
 *             date: "2025-10-27"
 *             concept: "Pago tarjeta"
 *     responses:
 *       201:
 *         description: Transferencia creada (movimiento de salida, entrada y gasto por comisión)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Error de validación (e.g., cuentas inválidas o monedas distintas)
 *       500:
 *         description: Error del servidor
 */

// file exists only to host Swagger JSDoc comments for /transactions

module.exports = {};
