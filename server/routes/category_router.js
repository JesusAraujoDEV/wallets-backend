const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const categoryService = require('../services/category_service');
const { validator } = require('../middlewares/validator');
const { createCategorySchema, updateCategorySchema, idQuerySchema, bulkIncludeInStatsSchema } = require('../schemas/category_schema');

router.use(protect);

router.get('/', async (req, res) => {
	try {
		const includeInStatsParam = req.query.includeInStats;
		const typeParam = req.query.type; // income|expense|ingreso|gasto

		let includeInStatsBool;
		if (typeof includeInStatsParam !== 'undefined') {
			const v = String(includeInStatsParam).toLowerCase();
			const truthy = v === '1' || v === 'true' || v === 'yes';
			const falsy = v === '0' || v === 'false' || v === 'no';
			if (!truthy && !falsy) return res.status(400).json({ ok: false, message: 'includeInStats must be true/false or 1/0' });
			includeInStatsBool = truthy;
		}

		let typeFilter;
		if (typeof typeParam !== 'undefined') {
			const t = String(typeParam).toLowerCase();
			const allowed = new Set(['income', 'expense', 'ingreso', 'gasto']);
			if (!allowed.has(t)) return res.status(400).json({ ok: false, message: 'type must be one of income|expense|ingreso|gasto' });
			typeFilter = t;
		}

		if (typeof includeInStatsBool === 'boolean' || typeof typeFilter === 'string') {
			const items = await categoryService.listFiltered(req.user.id, { includeInStats: includeInStatsBool, type: typeFilter });
			return res.json(items);
		}

		const items = await categoryService.list(req.user.id);
		return res.json(items);
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.post('/', validator(createCategorySchema), async (req, res) => {
	try {
		const created = await categoryService.create(req.user.id, req.body);
		res.status(201).json(created);
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.patch('/', validator(idQuerySchema, 'query'), validator(updateCategorySchema), async (req, res) => {
	try {
		const id = parseInt(req.query.id, 10);
		if (!id) return res.status(400).json({ ok: false, message: 'Parámetro id inválido.' });
		const r = await categoryService.update(id, req.user.id, req.body);
		if (!r) return res.status(404).json({ ok: false, message: 'Categoría no encontrada.' });
		res.json({ ok: true, ...r });
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.delete('/', validator(idQuerySchema, 'query'), async (req, res) => {
	try {
		const id = parseInt(req.query.id, 10);
		if (!id) return res.status(400).json({ ok: false, message: 'Parámetro id inválido.' });
		const r = await categoryService.remove(id, req.user.id);
		if (!r.rowCount) return res.status(404).json({ ok: false, message: 'Categoría no encontrada.' });
		res.json({ ok: true });
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

	// Bulk set include_in_stats = true
	router.post('/include-in-stats/enable', validator(bulkIncludeInStatsSchema), async (req, res) => {
		try {
			const { ids } = req.body;
			const r = await categoryService.bulkSetIncludeInStats(req.user.id, ids, true);
			res.json({ ok: true, ...r });
		} catch (e) {
			res.status(500).json({ ok: false, message: e.message });
		}
	});

	// Bulk set include_in_stats = false
	router.post('/include-in-stats/disable', validator(bulkIncludeInStatsSchema), async (req, res) => {
		try {
			const { ids } = req.body;
			const r = await categoryService.bulkSetIncludeInStats(req.user.id, ids, false);
			res.json({ ok: true, ...r });
		} catch (e) {
			res.status(500).json({ ok: false, message: e.message });
		}
	});

	// Note: filtering by includeInStats is handled via GET / with query param includeInStats=true|false

module.exports = router;
