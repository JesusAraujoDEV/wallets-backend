const categoryGroupService = require('../services/category_group_service');
const { NotFoundError } = require('../utils/errors');

async function list(req, res, next) {
  try {
    const items = await categoryGroupService.list(req.user.id);
    return res.json(items);
  } catch (e) { return next(e); }
}

async function create(req, res, next) {
  try {
    const created = await categoryGroupService.createGroup(req.user.id, req.body);
    return res.status(201).json(created);
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const updated = await categoryGroupService.updateGroup(req.user.id, groupId, req.body);
    if (!updated) throw new NotFoundError('Grupo de categoría no encontrado.');
    return res.json({ ok: true, ...updated });
  } catch (e) { return next(e); }
}

async function remove(req, res, next) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const result = await categoryGroupService.deleteGroup(req.user.id, groupId);
    if (!result || !result.rowCount) throw new NotFoundError('Grupo de categoría no encontrado.');
    return res.json({ ok: true });
  } catch (e) { return next(e); }
}

module.exports = { list, create, update, remove };