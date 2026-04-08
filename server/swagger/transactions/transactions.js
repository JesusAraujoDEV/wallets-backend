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
 *           pattern: '^[A-Z]{3}$'
 *         amountUsd:
 *           type: string
 *           description: Monto convertido a USD (string decimal)
 *         exchangeRateUsed:
 *           type: string
 *           description: Tasa usada cuando currency=VES
 *         date:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [completed, pending]
 *         categoryId:
 *           type: integer
 *         accountId:
 *           type: integer
 *           nullable: true
 *         debtId:
 *           type: integer
 *           nullable: true
 *           description: ID de la deuda vinculada (null si no está vinculada)
 *         type:
 *           type: string
 *           enum: [ingreso, gasto]
 *           description: Tipo de la categoría asociada
 *         category:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             type:
 *               type: string
 *               enum: [ingreso, gasto]
 *             icon:
 *               type: string
 *               nullable: true
 *             color:
 *               type: string
 *               nullable: true
 *             colorName:
 *               type: string
 *               nullable: true
 *       required: [id, description, amount, currency, date, status, categoryId]
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
 *         destinationAmount:
 *           type: number
 *           format: float
 *           description: Monto final que recibirá la cuenta destino. En multimoneda se compara contra BCV para registrar spread de ganancia o pérdida.
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
 *         data:
 *           type: array
 *           description: Transacciones de transferencia hidratadas con categoría para render inmediato en frontend.
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *         transfer:
 *           type: object
 *           properties:
 *             data:
 *               type: array
 *               description: Transacciones de transferencia hidratadas con categoría para render inmediato en frontend.
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *             outTx:
 *               $ref: '#/components/schemas/Transaction'
 *             inTx:
 *               $ref: '#/components/schemas/Transaction'
 *             spreadTx:
 *               nullable: true
 *               allOf:
 *                 - $ref: '#/components/schemas/Transaction'
 *             expectedAmount:
 *               type: number
 *               format: float
 *               description: Monto base esperado en destino calculado con la tasa BCV oficial para transferencias multimoneda.
 *             spreadAmount:
 *               type: number
 *               format: float
 *               description: Diferencia cambiaria firmada. Positiva indica ganancia, negativa indica pérdida.
 *             spreadType:
 *               type: string
 *               enum: [gain, loss, none]
 *               description: Tipo de diferencia cambiaria aplicada en destino.
 *             officialRateUsed:
 *               type: number
 *               format: float
 *               nullable: true
 *               description: Tasa BCV usada para calcular expectedAmount en transferencias multimoneda.
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
 *         name: analyticsBehavior
 *         schema:
 *           type: string
 *           enum: [include, exclude]
 *         description: Filtra por comportamiento analítico del grupo de la categoría
 *       - in: query
 *         name: debtId
 *         schema:
 *           type: string
 *         description: >
 *           Filtrar por deuda vinculada. Enviar un número (ej. "3") para filtrar por esa deuda.
 *           Enviar "null" (string) para obtener solo transacciones sin deuda vinculada (debt_id IS NULL).
 *           Omitir para no filtrar por este campo.
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
 *
 * /transactions/pending:
 *   get:
 *     summary: Listar todas las transacciones pendientes
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Lista de transacciones con status pending
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Request inválido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
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
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor

 * /transactions/{id}/confirm:
 *   patch:
 *     summary: Confirmar transacción pendiente y aplicarla al balance con datos finales de pago
 *     tags: [Transactions]
 *     description: Si la transacción tiene debtId vinculado, también recalcula y sincroniza el status de la deuda (pending, partial, paid).
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
 *             required: [accountId]
 *             properties:
 *               accountId:
 *                 type: integer
 *                 description: Cuenta final desde donde se paga la transacción.
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha final del pago. Si no se envía, usa la fecha actual.
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Monto final pagado.
 *               currency:
 *                 type: string
 *                 pattern: '^[A-Z]{3}$'
 *                 description: Moneda final del pago (debe coincidir con la moneda de la cuenta).
 *     responses:
 *       200:
 *         description: Transacción confirmada y balance actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 tx:
 *                   $ref: '#/components/schemas/Transaction'
 *                 message:
 *                   type: string
 *       400:
 *         description: Request inválido o transacción no pendiente
 *       401:
 *         description: No autorizado
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
 *     summary: Crear una transferencia entre cuentas (split multimoneda con ganancia/pérdida cambiaria y comisión opcional)
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
 *             amount: 10
 *             destinationAmount: 765
 *             commission: 10
 *             date: "2025-10-27"
 *             concept: "Pago tarjeta"
 *     responses:
 *       201:
 *         description: Transferencia creada (salida, entrada base, spread cambiario opcional y comisión opcional)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Error de validación (e.g., cuentas inválidas, falta destinationAmount en multimoneda o falla BCV)
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

// file exists only to host Swagger JSDoc comments for /transactions

module.exports = {};
