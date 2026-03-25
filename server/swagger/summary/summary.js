/**
 * @swagger
 * tags:
 *   - name: Summary
 *     description: Resúmenes y balances
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
 *         description: Busca en descripción y nombre de categoría
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: IDs de categorías separadas por coma para filtrar (ej. "44,20,43")
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: IDs de cuentas separadas por coma para filtrar; si se envía un único ID, la respuesta será simplificada con solo el balance de esa cuenta
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
 *         description: Mes a filtrar (YYYY-MM). Aplica al cálculo de ingresos y gastos
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
 *     summary: Resumen de ingresos por mes o total
 *     tags: [Summary]
 *     parameters:
 *       - in: query
 *         name: from_month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *         description: Mes inicial (YYYY-MM). Si no se envía, se devuelve solo el total
 *       - in: query
 *         name: to_month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *         description: Mes final (YYYY-MM), inclusive. Si no se envía, se usa from_month
 *       - in: query
 *         name: analyticsBehavior
 *         schema:
 *           type: string
 *           enum: [include, exclude]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: IDs de categorías separados por coma para filtrar (ej. "44,20,43")
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: IDs de cuentas separados por coma para filtrar
 *     responses:
 *       200:
 *         description: Total y mapa mensual de ingresos o solo el total si no se envían meses
 *         content:
 *           application/json:
 *             examples:
 *               monthly:
 *                 summary: Ejemplo mensual
 *                 value:
 *                   ok: true
 *                   income_total: 1091.71
 *                   income:
 *                     - income_2025-09: 106.36
 *                       income_2025-10: 985.35
 *               totalOnly:
 *                 summary: Ejemplo solo total
 *                 value:
 *                   ok: true
 *                   income_total: 1091.71
 *             oneOf:
 *               - description: Resumen mensual
 *                 schema:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                     income_total:
 *                       type: number
 *                     income:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Objeto con claves income_YYYY-MM y sus totales
 *                 examples:
 *                   monthly:
 *                     summary: Ejemplo mensual
 *                     value:
 *                       ok: true
 *                       income_total: 1091.71
 *                       income:
 *                         - income_2025-09: 106.36
 *                           income_2025-10: 985.35
 *               - description: Solo total (sin meses)
 *                 schema:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                     income_total:
 *                       type: number
 *                 examples:
 *                   totalOnly:
 *                     summary: Ejemplo solo total
 *                     value:
 *                       ok: true
 *                       income_total: 1091.71
 *
 * /summary/expense:
 *   get:
 *     summary: Resumen de gastos por mes o total
 *     tags: [Summary]
 *     parameters:
 *       - in: query
 *         name: from_month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *         description: Mes inicial (YYYY-MM). Si no se envía, se devuelve solo el total
 *       - in: query
 *         name: to_month
 *         schema:
 *           type: string
 *           pattern: "^\\d{4}-\\d{2}$"
 *         description: Mes final (YYYY-MM), inclusive. Si no se envía, se usa from_month
 *       - in: query
 *         name: analyticsBehavior
 *         schema:
 *           type: string
 *           enum: [include, exclude]
 *     responses:
 *       200:
 *         description: Total y mapa mensual de gastos o solo el total si no se envían meses
 *         content:
 *           application/json:
 *             examples:
 *               monthly:
 *                 summary: Ejemplo mensual
 *                 value:
 *                   ok: true
 *                   expense_total: 845.22
 *                   expense:
 *                     - expense_2025-09: 120.10
 *                       expense_2025-10: 725.12
 *               totalOnly:
 *                 summary: Ejemplo solo total
 *                 value:
 *                   ok: true
 *                   expense_total: 845.22
 *             oneOf:
 *               - description: Resumen mensual
 *                 schema:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                     expense_total:
 *                       type: number
 *                     expense:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Objeto con claves expense_YYYY-MM y sus totales
 *                 examples:
 *                   monthly:
 *                     summary: Ejemplo mensual
 *                     value:
 *                       ok: true
 *                       expense_total: 845.22
 *                       expense:
 *                         - expense_2025-09: 120.10
 *                           expense_2025-10: 725.12
 *               - description: Solo total (sin meses)
 *                 schema:
 *                   type: object
 *                   properties:
 *                     ok:
 *                       type: boolean
 *                     expense_total:
 *                       type: number
 *                 examples:
 *                   totalOnly:
 *                     summary: Ejemplo solo total
 *                     value:
 *                       ok: true
 *                       expense_total: 845.22
 */

// file exists only to host Swagger JSDoc comments for /summary endpoints

module.exports = {};
