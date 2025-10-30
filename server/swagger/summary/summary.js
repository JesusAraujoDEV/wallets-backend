/**
 * @swagger
 * tags:
 *   - name: Summary
 *     description: Resmenes y balances
 *
 * /summary/balance:
 *   get:
 *     summary: Balance total en USDT (USD) y resumen de ingresos/gastos
 *     tags: [Summary]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Busca en descripcin y nombre de categora
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: IDs de categoras separadas por coma
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: IDs de cuentas separadas por coma; si se envía un único ID, la respuesta será simplificada con solo el balance de esa cuenta
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Da exacto a filtrar (si no se enva rango o mes)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha inicial (inclusive)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha final (inclusive)
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *         example: "2025-09"
 *         description: Mes a filtrar en formato YYYY-MM
 *       - in: query
 *         name: includeInStats
 *         schema:
 *           type: string
 *           enum: ['0','1','true','false']
 *         description: Aplica al calculo de ingresos y gastos
 *     responses:
 *       200:
 *         description: Balance calculado
 *         content:
 *           application/json:
 *             oneOf:
 *               - description: Respuesta agregada (todas las cuentas o múltiples IDs)
 *                 schema:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                     balance:
 *                       type: object
 *                       properties:
 *                         accounts_total_usd:
 *                           type: number
 *                         income_total_usd:
 *                           type: number
 *                         expense_total_usd:
 *                           type: number
 *                         net_total_usd:
 *                           type: number
 *               - description: Respuesta simplificada (un solo accountId)
 *                 schema:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                     balance:
 *                       type: number
 *
 * /summary/income:
 *   get:
 *     summary: Resumen de ingresos
 *     tags: [Summary]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *       - in: query
 *         name: includeInStats
 *         schema:
 *           type: string
 *           enum: ['0','1','true','false']
 *     responses:
 *       200:
 *         description: Total y lista de ingresos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 income_total:
 *                   type: number
 *                 transactions_income:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *
 * /summary/expense:
 *   get:
 *     summary: Resumen de gastos
 *     tags: [Summary]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *       - in: query
 *         name: includeInStats
 *         schema:
 *           type: string
 *           enum: ['0','1','true','false']
 *     responses:
 *       200:
 *         description: Total y lista de gastos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 expense_total:
 *                   type: number
 *                 transactions_expense:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 */

// file exists only to host Swagger JSDoc comments for /summary endpoints

module.exports = {};
