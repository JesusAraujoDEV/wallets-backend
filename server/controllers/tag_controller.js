const tagService = require('../services/tag_service');
const { BadRequestError } = require('../utils/errors');

async function list(req, res, next) {
  try {
    const tags = await tagService.list(req.user.id);
    return res.json(tags);
  } catch (e) { return next(e); }
}

async function create(req, res, next) {
  try {
    const tag = await tagService.create(req.user.id, req.body);
    return res.status(201).json(tag);
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) throw new BadRequestError('Parámetro id inválido.');
    const tag = await tagService.update(id, req.user.id, req.body);
    return res.json(tag);
  } catch (e) { return next(e); }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) throw new BadRequestError('Parámetro id inválido.');
    await tagService.remove(id, req.user.id);
    return res.json({ ok: true });
  } catch (e) { return next(e); }
}

async function assignTags(req, res, next) {
  try {
    const txId = parseInt(req.params.transactionId, 10);
    if (!txId) throw new BadRequestError('transactionId inválido.');
    const tags = await tagService.assignTagsToTransaction(txId, req.user.id, req.body.tagIds);
    return res.json({ ok: true, tags });
  } catch (e) { return next(e); }
}

async function getTransactionTags(req, res, next) {
  try {
    const txId = parseInt(req.params.transactionId, 10);
    if (!txId) throw new BadRequestError('transactionId inválido.');
    const tags = await tagService.getTagsForTransaction(txId, req.user.id);
    return res.json(tags);
  } catch (e) { return next(e); }
}

async function getByTag(req, res, next) {
  try {
    const tagId = parseInt(req.params.id, 10);
    if (!tagId) throw new BadRequestError('Parámetro id inválido.');
    const result = await tagService.getTransactionsByTag(tagId, req.user.id);
    return res.json(result);
  } catch (e) { return next(e); }
}

module.exports = { list, create, update, remove, assignTags, getTransactionTags, getByTag };
