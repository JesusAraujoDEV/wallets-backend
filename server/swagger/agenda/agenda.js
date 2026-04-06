/**
 * @swagger
 * components:
 *   schemas:
 *     AgendaForecastItem:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [subscription, debt]
 *         date:
 *           type: string
 *           format: date
 *         amount:
 *           type: number
 *           format: float
 *         description:
 *           type: string
 *         direction:
 *           type: string
 *           enum: [ingreso, gasto]
 *       required: [type, date, amount, description, direction]
 *
 * tags:
 *   - name: Agenda
 *     description: Proyecciones unificadas para calendario y pendientes
 */

/**
 * @swagger
 * /agenda/forecast:
 *   get:
 *     summary: Proyectar agenda financiera de los próximos 60 días
 *     tags: [Agenda]
 *     description: Une suscripciones recurrentes y deudas no pagadas con vencimiento dentro de la ventana.
 *     responses:
 *       200:
 *         description: Lista unificada ordenada por fecha ascendente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AgendaForecastItem'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
