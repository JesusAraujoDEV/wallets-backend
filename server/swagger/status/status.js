/**
 * @swagger
 * tags:
 *   - name: Status
 *     description: Estado y salud del servicio
 *
 * /status:
 *   get:
 *     summary: Verifica el estado general del servicio
 *     tags: [Status]
 *     responses:
 *       200:
 *         description: Estado actual del servicio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 info:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     version:
 *                       type: string
 *                     env:
 *                       type: string
 *                     uptimeSeconds:
 *                       type: integer
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 components:
 *                   type: object
 *                   properties:
 *                     db:
 *                       type: object
 *                       properties:
 *                         ok:
 *                           type: boolean
 *                         latencyMs:
 *                           type: integer
 *                         error:
 *                           type: string
 *                           nullable: true
 *                     exchangeRateApi:
 *                       type: object
 *                       properties:
 *                         ok:
 *                           type: boolean
 *                         latencyMs:
 *                           type: integer
 *                         error:
 *                           type: string
 *                           nullable: true
 *                 totalLatencyMs:
 *                   type: integer
 */

// file exists only to host Swagger JSDoc comments for /status

module.exports = {};
