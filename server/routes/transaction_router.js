const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const txService = require('../services/transaction_service');

router.use(protect);
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
