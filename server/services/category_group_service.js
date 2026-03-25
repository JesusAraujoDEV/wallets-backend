const { models } = require('../libs/sequelize');
const { BadRequestError, ConflictError } = require('../utils/errors');

const ALLOWED_TYPES = new Set(['ingreso', 'gasto', 'neutral']);
const ALLOWED_ANALYTICS_BEHAVIOR = new Set(['include', 'exclude']);

function normalizeAnalyticsBehavior(payload = {}) {
  if (typeof payload.analyticsBehavior !== 'undefined') return payload.analyticsBehavior;
  if (typeof payload.analytics_behavior !== 'undefined') return payload.analytics_behavior;
  return undefined;
}

function validateType(type) {
  if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
    throw new BadRequestError('Campo type inválido. Valores permitidos: ingreso|gasto|neutral.');
  }
}

function validateAnalyticsBehavior(analyticsBehavior) {
  if (typeof analyticsBehavior !== 'string' || !ALLOWED_ANALYTICS_BEHAVIOR.has(analyticsBehavior)) {
    throw new BadRequestError('Campo analyticsBehavior inválido. Valores permitidos: include|exclude.');
  }
}

async function list(userId) {
  return await models.CategoryGroup.findAll({
    attributes: ['id', 'name', 'type', ['analytics_behavior', 'analyticsBehavior'], ['user_id', 'userId']],
    where: { userId },
    order: [['type', 'ASC'], ['name', 'ASC'], ['id', 'ASC']],
    raw: true,
  });
}

async function createGroup(userId, data = {}) {
  const { name, type } = data;
  const analyticsBehavior = normalizeAnalyticsBehavior(data);

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new BadRequestError('Campo name es requerido.');
  }
  if (typeof type === 'undefined' || type === null) {
    throw new BadRequestError('Campo type es requerido.');
  }
  if (typeof analyticsBehavior === 'undefined' || analyticsBehavior === null) {
    throw new BadRequestError('Campo analytics_behavior es requerido.');
  }

  validateType(type);
  validateAnalyticsBehavior(analyticsBehavior);

  const created = await models.CategoryGroup.create({
    name: name.trim(),
    type,
    analyticsBehavior,
    userId,
  });

  return { id: created.id };
}

async function updateGroup(userId, groupId, changes = {}) {
  const group = await models.CategoryGroup.findOne({ where: { id: groupId, userId } });
  if (!group) return null;

  const updates = {};
  if (typeof changes.name !== 'undefined') {
    if (typeof changes.name !== 'string' || changes.name.trim().length === 0) {
      throw new BadRequestError('Campo name inválido.');
    }
    updates.name = changes.name.trim();
  }
  if (typeof changes.type !== 'undefined') {
    validateType(changes.type);
    updates.type = changes.type;
  }

  const analyticsBehavior = normalizeAnalyticsBehavior(changes);
  if (typeof analyticsBehavior !== 'undefined') {
    validateAnalyticsBehavior(analyticsBehavior);
    updates.analyticsBehavior = analyticsBehavior;
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError('No hay cambios para actualizar.');
  }

  await group.update(updates);
  return { id: groupId };
}

async function deleteGroup(userId, groupId) {
  const group = await models.CategoryGroup.findOne({ where: { id: groupId, userId } });
  if (!group) return null;

  const categoriesCount = await models.Category.count({ where: { userId, groupId: group.id } });
  if (categoriesCount > 0) {
    throw new ConflictError('No puedes borrar un grupo con categorías');
  }

  const rowCount = await models.CategoryGroup.destroy({ where: { id: groupId, userId } });
  return { rowCount };
}

module.exports = { list, createGroup, updateGroup, deleteGroup };