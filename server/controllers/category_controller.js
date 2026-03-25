const categoryService = require('../services/category_service');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function list(req, res, next) {
  try {
    const { groupId, type } = req.query;

    let groupIdFilter;
    if (typeof groupId !== 'undefined') {
      groupIdFilter = parseInt(groupId, 10);
      if (!groupIdFilter || Number.isNaN(groupIdFilter)) throw new BadRequestError('groupId must be a positive integer');
    }

    let typeFilter;
    if (typeof type !== 'undefined') {
      const t = String(type).toLowerCase();
      const allowed = new Set(['income', 'expense', 'ingreso', 'gasto']);
      if (!allowed.has(t)) throw new BadRequestError('type must be one of income|expense|ingreso|gasto');
      typeFilter = t;
    }

    if (typeof groupIdFilter === 'number' || typeof typeFilter === 'string') {
      const items = await categoryService.listFiltered(req.user.id, { groupId: groupIdFilter, type: typeFilter });
      return res.json(items);
    }

    const items = await categoryService.list(req.user.id);
    return res.json(items);
  } catch (e) { return next(e); }
}

async function create(req, res, next) {
  try {
    const created = await categoryService.create(req.user.id, req.body);
    return res.status(201).json(created);
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.query.id, 10);
    if (!id) throw new BadRequestError('Parámetro id inválido.');
    const r = await categoryService.update(id, req.user.id, req.body);
    if (!r) throw new NotFoundError('Categoría no encontrada.');
    return res.json({ ok: true, ...r });
  } catch (e) { return next(e); }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.query.id, 10);
    if (!id) throw new BadRequestError('Parámetro id inválido.');
    const r = await categoryService.remove(id, req.user.id);
    if (!r.rowCount) throw new NotFoundError('Categoría no encontrada.');
    return res.json({ ok: true });
  } catch (e) { return next(e); }
}

module.exports = { list, create, update, remove };