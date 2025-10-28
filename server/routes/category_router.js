const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const categoryService = require('../services/category_service');
const { validator } = require('../middlewares/validator');
const { createCategorySchema, updateCategorySchema, idQuerySchema, bulkIncludeInStatsSchema } = require('../schemas/category_schema');

router.use(protect);

router.get('/', async (req, res) => {
	try {
		const param = req.query.includeInStats;
		if (typeof param !== 'undefined') {
			const v = String(param).toLowerCase();
			const truthy = v === '1' || v === 'true' || v === 'yes';
			const falsy = v === '0' || v === 'false' || v === 'no';
			if (!truthy && !falsy) return res.status(400).json({ ok: false, message: 'includeInStats must be true/false or 1/0' });
			const items = await categoryService.listByIncludeInStats(req.user.id, truthy);
			return res.json(items);
		}
		const items = await categoryService.list(req.user.id);
		res.json(items);
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
