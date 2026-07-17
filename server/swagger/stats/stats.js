/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Endpoints de analítica avanzada
 */

/**
 * @swagger
 * /stats/net-cash-flow:
 *   get:
 *     tags: [Stats]
 *     summary: Flujo neto de caja e índice de ahorro por período
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema: { type: string, example: '2025-01-01' }
 *         required: true
 *         description: Fecha inicio (YYYY-MM-DD)
 *       - in: query
 *         name: to_date
 *         schema: { type: string, example: '2025-03-31' }
 *         required: true
 *         description: Fecha fin (YYYY-MM-DD)
 *       - in: query
 *         name: time_unit
 *         schema: { type: string, enum: [month, week], default: month }
 *         description: Unidad de tiempo para agrupar
 *       - in: query
 *         name: accountId
 *         schema: { type: string, example: '1,2' }
 *         description: Filtrar por una o varias cuentas (separadas por coma)
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *         description: Filtrar por grupo de categorías
 *     responses:
 *       200:
 *         description: Serie temporal de ingresos/egresos con flujo neto e índice de ahorro
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   summary:
 *                     total_income: 2500
 *                     total_expenses: 1800
 *                     net_cash_flow: 700
 *                     avg_savings_rate: 0.28
 *                   time_series:
 *                     - period: '2025-01'
 *                       income: 1000
 *                       expenses: 700
 *                       net_flow: 300
 *                       savings_rate: 0.3
 *                     - period: '2025-02'
 *                       income: 800
 *                       expenses: 600
 *                       net_flow: 200
 *                       savings_rate: 0.25
 *                     - period: '2025-03'
 *                       income: 700
 *                       expenses: 500
 *                       net_flow: 200
 *                       savings_rate: 0.2857
 */

/**
 * @swagger
 * /stats/spending-heatmap:
 *   get:
 *     tags: [Stats]
 *     summary: Mapa de calor de gastos por categoría y día de la semana
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema: { type: string, example: '2025-03-01' }
 *         required: true
 *       - in: query
 *         name: to_date
 *         schema: { type: string, example: '2025-03-31' }
 *         required: true
 *       - in: query
 *         name: accountId
 *         schema: { type: string, example: '1,2' }
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *     responses:
 *       200:
 *         description: Categorías, días y puntos de datos agregados en USD normalizados
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   categories: ["Comida","Transporte","Servicios"]
 *                   weekdays: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
 *                   data_points:
 *                     - { category_idx: 0, day_idx: 1, amount: 35.5 }
 *                     - { category_idx: 1, day_idx: 5, amount: 10 }
 *                   summary:
 *                     peak_category: "Comida"
 *                     peak_day: "Lunes"
 */

/**
 * @swagger
 * /stats/income-heatmap:
 *   get:
 *     tags: [Stats]
 *     summary: Mapa de calor de ingresos por categoría y día de la semana
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema: { type: string, example: '2025-03-01' }
 *         required: true
 *       - in: query
 *         name: to_date
 *         schema: { type: string, example: '2025-03-31' }
 *         required: true
 *       - in: query
 *         name: accountId
 *         schema: { type: string, example: '1,2' }
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *     responses:
 *       200:
 *         description: Categorías, días y puntos de datos agregados en USD normalizados (ingresos)
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   categories: ["Salario","Bonos","Intereses"]
 *                   weekdays: ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
 *                   data_points:
 *                     - { category_idx: 0, day_idx: 5, amount: 1500 }
 *                   summary:
 *                     peak_category: "Salario"
 *                     peak_day: "Viernes"
 */


/**
 * @swagger
 * /stats/expense-volatility:
 *   get:
 *     tags: [Stats]
 *     summary: Volatilidad de gastos (estadísticos tipo boxplot) para las principales categorías
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema: { type: string, example: '2025-01-01' }
 *         required: true
 *       - in: query
 *         name: to_date
 *         schema: { type: string, example: '2025-03-31' }
 *         required: true
 *       - in: query
 *         name: top_n_categories
 *         schema: { type: integer, example: 5, default: 5 }
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *     responses:
 *       200:
 *         description: Lista de categorías con q1, mediana, q3, min, max y outliers
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   categories_data:
 *                     - category: "Comida"
 *                       count: 42
 *                       q1: 8.5
 *                       median: 12.2
 *                       q3: 19.7
 *                       min: 5
 *                       max: 30
 *                       outliers: [45.2]
 */

/**
 * @swagger
 * /stats/income-volatility:
 *   get:
 *     tags: [Stats]
 *     summary: Volatilidad de ingresos (estadísticos tipo boxplot) para las principales categorías
 *     parameters:
 *       - in: query
 *         name: from_date
 *         schema: { type: string, example: '2025-01-01' }
 *         required: true
 *       - in: query
 *         name: to_date
 *         schema: { type: string, example: '2025-03-31' }
 *         required: true
 *       - in: query
 *         name: top_n_categories
 *         schema: { type: integer, example: 5, default: 5 }
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *     responses:
 *       200:
 *         description: Lista de categorías con q1, mediana, q3, min, max y outliers (ingresos)
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   categories_data:
 *                     - category: "Salario"
 *                       count: 12
 *                       q1: 900
 *                       median: 1000
 *                       q3: 1100
 *                       min: 850
 *                       max: 1200
 *                       outliers: []
 */

/**
 * @swagger
 * /stats/comparative-mom:
 *   get:
 *     tags: [Stats]
 *     summary: Comparativa entre dos periodos (por defecto MTD vs MTD anterior) por categoría y total
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, example: '2025-03-15' }
 *         description: Fecha de referencia para el modo MTD por defecto; ignorada si se pasan current_from/current_to
 *       - in: query
 *         name: current_from
 *         schema: { type: string, example: '2025-03-01' }
 *         description: Inicio del periodo actual (YYYY-MM-DD). Requiere current_to, previous_from y previous_to.
 *       - in: query
 *         name: current_to
 *         schema: { type: string, example: '2025-03-15' }
 *         description: Fin del periodo actual (YYYY-MM-DD)
 *       - in: query
 *         name: previous_from
 *         schema: { type: string, example: '2024-03-01' }
 *         description: Inicio del periodo de comparación (YYYY-MM-DD)
 *       - in: query
 *         name: previous_to
 *         schema: { type: string, example: '2024-03-15' }
 *         description: Fin del periodo de comparación (YYYY-MM-DD)
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *         description: Filtrar por grupo de categorías
 *     responses:
 *       200:
 *         description: Resumen y deltas por categoría
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   summary:
 *                     current_period_start: "2025-03-01"
 *                     current_period_end: "2025-03-15"
 *                     previous_period_start: "2025-02-01"
 *                     previous_period_end: "2025-02-15"
 *                     current_total: 520
 *                     previous_total: 480
 *                     total_delta_usd: 40
 *                     total_delta_percent: 0.083
 *                   categories_comparison:
 *                     - { category: "Comida", current_amount: 200, previous_amount: 180, delta_percent: 0.111 }
 */

/**
 * @swagger
 * /stats/comparative-mom-income:
 *   get:
 *     tags: [Stats]
 *     summary: Comparativa entre dos periodos (por defecto MTD vs MTD anterior) de ingresos por categoría y total
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, example: '2025-03-15' }
 *         description: Fecha de referencia para el modo MTD por defecto; ignorada si se pasan current_from/current_to
 *       - in: query
 *         name: current_from
 *         schema: { type: string, example: '2025-03-01' }
 *         description: Inicio del periodo actual (YYYY-MM-DD). Requiere current_to, previous_from y previous_to.
 *       - in: query
 *         name: current_to
 *         schema: { type: string, example: '2025-03-15' }
 *         description: Fin del periodo actual (YYYY-MM-DD)
 *       - in: query
 *         name: previous_from
 *         schema: { type: string, example: '2024-03-01' }
 *         description: Inicio del periodo de comparación (YYYY-MM-DD)
 *       - in: query
 *         name: previous_to
 *         schema: { type: string, example: '2024-03-15' }
 *         description: Fin del periodo de comparación (YYYY-MM-DD)
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *         description: Filtrar por grupo de categorías
 *     responses:
 *       200:
 *         description: Resumen y deltas por categoría (ingresos)
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   summary:
 *                     current_period_start: "2025-03-01"
 *                     current_period_end: "2025-03-15"
 *                     previous_period_start: "2025-02-01"
 *                     previous_period_end: "2025-02-15"
 *                     current_total: 3200
 *                     previous_total: 3000
 *                     total_delta_usd: 200
 *                     total_delta_percent: 0.0667
 *                   categories_comparison:
 *                     - { category: "Salario", current_amount: 3000, previous_amount: 2800, delta_percent: 0.0714 }
 */

/**
 * @swagger
 * /stats/monthly-forecast:
 *   get:
 *     tags: [Stats]
 *     summary: Proyección de gasto mensual con promedio diario
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema: { type: string, example: '1,2' }
 *       - in: query
 *         name: groupId
 *         schema: { type: integer, minimum: 1, example: 10 }
 *         description: Filtrar por grupo de categorías
 *       - in: query
 *         name: date
 *         schema: { type: string, example: '2025-03-20' }
 *       - in: query
 *         name: budget_total
 *         schema: { type: number, example: 800 }
 *         description: Presupuesto esperado del mes para comparar sobre/under
 *     responses:
 *       200:
 *         description: Métricas del mes actual y proyección de cierre
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 value:
 *                   current_date: '2025-03-20'
 *                   days_in_month: 31
 *                   days_elapsed: 20
 *                   current_spending_mtd: 520
 *                   avg_daily_spending: 26
 *                   projected_total_spending: 806
 *                   budget_total: 800
 *                   projected_over_under: 6
 */
