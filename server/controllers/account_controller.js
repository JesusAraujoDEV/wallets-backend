const accountService = require('../services/account_service');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function list(req, res, next) {
  try {
    const items = await accountService.list(req.user.id);
    return res.json(items);
  } catch (e) { return next(e); }
}

async function create(req, res, next) {
  try {
    const created = await accountService.create(req.user.id, req.body);
    return res.status(201).json(created);
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.query.id, 10);
    if (!id) throw new BadRequestError('Parámetro id inválido.');
    const r = await accountService.update(id, req.user.id, req.body);
    if (!r) throw new NotFoundError('Cuenta no encontrada.');
    return res.json({ ok: true, ...r });
  } catch (e) { return next(e); }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.query.id, 10);
    if (!id) throw new BadRequestError('Parámetro id inválido.');
    const r = await accountService.remove(id, req.user.id);
    if (!r.rowCount) throw new NotFoundError('Cuenta no encontrada.');
    return res.json({ ok: true });
  } catch (e) { return next(e); }
}

module.exports = { list, create, update, remove };