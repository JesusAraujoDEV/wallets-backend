const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const txService = require('../services/transaction_service');

router.use(protect);

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
 */
router.get('/', async (req, res) => {
	const userId = req.user.id;
	const { grouped, pageSize, cursorDate, q, type, categoryId, accountId, date, dateFrom, dateTo, month } = req.query;
	try {
		if (grouped === '1') {
			const result = await txService.getGroupedTransactions({
				userId,
				pageSize: parseInt(pageSize) || 20,
				cursorDate,
				q,
				type,
				categoryId,
				accountId,
				date,
				dateFrom,
				dateTo,
				month,
			});
			return res.json(result);
		}
		const rows = await txService.getAllTransactions({ userId, q, type, categoryId, accountId, date, dateFrom, dateTo, month });
		return res.json(rows);
	} catch (e) {
		res.status(500).json({ ok: false, message: 'Error del servidor al obtener transacciones.', error: e.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const result = await txService.createTransaction(req.user.id, req.body);
		res.status(201).json({ ok: true, newId: result.tx.id, tx: result.tx });
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.patch('/', async (req, res) => {
	try {
		const id = parseInt(req.query.id, 10);
		if (!id || Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Parámetro id inválido.' });
		const result = await txService.updateTransaction(id, req.user.id, req.body);
		if (!result) return res.status(404).json({ ok: false, message: 'Transacción no encontrada o no pertenece al usuario.' });
		res.json({ ok: true, tx: result.tx, message: 'Transacción actualizada' });
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.delete('/', async (req, res) => {
	try {
		const id = parseInt(req.query.id, 10);
		const result = await txService.deleteTransaction(id, req.user.id);
		if (!result.rowCount) return res.status(404).json({ ok: false, message: 'Transacción no encontrada o no pertenece al usuario.' });
		res.json({ ok: true });
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

module.exports = router;
