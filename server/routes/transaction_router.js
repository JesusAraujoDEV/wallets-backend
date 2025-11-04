const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const txService = require('../services/transaction_service');
const { validator } = require('../middlewares/validator');
const { createTransactionSchema, transferSchema } = require('../schemas/transaction_schema');
const { buildTransfersExport } = require('../services/export_service');

router.use(protect);
router.get('/', async (req, res) => {
	const userId = req.user.id;
	const { grouped, pageSize, cursorDate, q, type, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats } = req.query;
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
				includeInStats,
			});
			return res.json(result);
		}
		const rows = await txService.getAllTransactions({ userId, q, type, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
		return res.json(rows);
	} catch (e) {
		res.status(500).json({ ok: false, message: 'Error del servidor al obtener transacciones.', error: e.message });
	}
});

router.post('/', validator(createTransactionSchema), async (req, res) => {
	try {
		const result = await txService.createTransaction(req.user.id, req.body);
		res.status(201).json({ ok: true, newId: result.tx.id, tx: result.tx, commissionTx: result.commissionTx || null });
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.post('/transfer', validator(transferSchema), async (req, res) => {
	try {
		const result = await txService.createTransfer(req.user.id, req.body);
		res.status(201).json({ ok: true, transfer: result });
	} catch (e) {
		res.status(400).json({ ok: false, message: e.message });
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

// Export transfers (GET for simple queries, POST for complex filters)
async function handleExportTransfers(req, res) {
	try {
		const userId = req.user.id;
		const payload = req.method === 'GET' ? req.query : req.body;
		const format = (payload.format || 'xlsx').toLowerCase();
		const fromDate = payload.from_date;
		const toDate = payload.to_date;
		const accountId = payload.account_id || payload.accountId;
		const includeCommission = String(payload.include_commission || payload.includeCommission || 'false').toLowerCase() === 'true';

		// basic validation
		const dateRe = /^\d{4}-\d{2}-\d{2}$/;
		if (fromDate && !dateRe.test(fromDate)) return res.status(400).json({ ok: false, message: 'from_date inválida. Use YYYY-MM-DD' });
		if (toDate && !dateRe.test(toDate)) return res.status(400).json({ ok: false, message: 'to_date inválida. Use YYYY-MM-DD' });
		if (format !== 'xlsx' && format !== 'pdf') return res.status(400).json({ ok: false, message: 'Formato inválido. Use pdf o xlsx' });

			// Delegate business logic to service
			const rows = await txService.getTransferExportRows({
				userId,
				fromDate,
				toDate,
				accountId,
				includeCommission,
				createdBy: req.user.email || req.user.id,
			});

			// Build export in service (returns stream and metadata) and pipe
			const { contentType, filename, stream } = await buildTransfersExport({
				userId,
				fromDate,
				toDate,
				accountId,
				includeCommission,
				createdBy: req.user.email || req.user.id,
				format,
			});

			res.set('Cache-Control', 'no-store');
			res.setHeader('Content-Type', contentType);
			res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
			stream.on('error', () => {
				if (!res.headersSent) res.status(500);
				res.end();
			});
			return stream.pipe(res);
	} catch (e) {
		// If headers already sent, cannot send JSON error
		if (res.headersSent) return req.socket.destroy();
		res.status(500).json({ ok: false, message: e.message });
	}
}

router.get('/transfer/export', handleExportTransfers);
router.post('/transfer/export', express.json(), handleExportTransfers);

module.exports = router;
