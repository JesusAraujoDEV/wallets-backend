const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const categoryService = require('../services/category_service');

router.use(protect);

router.get('/', async (req, res) => {
	try {
		const items = await categoryService.list(req.user.id);
		res.json(items);
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const created = await categoryService.create(req.user.id, req.body);
		res.status(201).json(created);
	} catch (e) {
		res.status(500).json({ ok: false, message: e.message });
	}
});

router.patch('/', async (req, res) => {
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

router.delete('/', async (req, res) => {
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

module.exports = router;
