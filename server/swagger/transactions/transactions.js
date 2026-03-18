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
 *       - in: query
 *         name: includeInStats
 *         schema:
 *           type: string
 *           enum: ['0','1','true','false']
 *         description: Filtra por si la categoría está marcada para estadísticas (true/false)
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
 *               commission:
 *                 type: number
 *                 format: float
 *                 description: Comisión opcional; si se envía, se crea un gasto adicional con categoría "comision" en la misma cuenta
 *             required: [description, amount, currency, date, categoryId, accountId]
 *     responses:
 *       201:
 *         description: Transacción creada (y comisión si aplica)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 newId:
 *                   type: integer
 *                 tx:
 *                   $ref: '#/components/schemas/Transaction'
 *                 commissionTx:
 *                   nullable: true
 *                   allOf:
 *                     - $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error del servidor
 *
 * /transactions/transfer/export:
 *   get:
 *     summary: Exportar transferencias (simple por query) en PDF o Excel (stream)
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pdf, xlsx]
 *         description: Formato del archivo a exportar
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicio (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha fin (YYYY-MM-DD)
 *       - in: query
 *         name: account_id
 *         schema:
 *           type: integer
 *         description: Filtrar por cuenta (opcional)
 *       - in: query
 *         name: include_commission
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir filas de comisión en el export
 *     responses:
 *       200:
 *         description: Archivo exportado (stream)
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: attachment; filename*=UTF-8''transfers_YYYY-MM-DD.pdf|.xlsx
 *           Cache-Control:
 *             schema:
 *               type: string
 *             description: no-store
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 *   post:
 *     summary: Exportar transferencias (preferido con body JSON para filtros complejos)
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [pdf, xlsx]
 *               from_date:
 *                 type: string
 *                 format: date
 *               to_date:
 *                 type: string
 *                 format: date
 *               account_id:
 *                 type: integer
 *               include_commission:
 *                 type: boolean
 *                 default: false
 *               timezone:
 *                 type: string
 *                 description: Zona horaria para formateos (opcional)
 *           examples:
 *             pdf:
 *               value:
 *                 format: pdf
 *                 from_date: '2025-01-01'
 *                 to_date: '2025-10-31'
 *                 include_commission: true
 *     responses:
 *       200:
 *         description: Archivo exportado (stream)
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: attachment; filename*=UTF-8''transfers_YYYY-MM-DD.pdf|.xlsx
 *           Cache-Control:
 *             schema:
 *               type: string
 *             description: no-store
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
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
