const { models } = require('../libs/sequelize');
const { BadRequestError } = require('../utils/errors');

function normalizeType(input) {
  if (!input) return null;
  const v = String(input).toLowerCase();
  if (v === 'ingreso' || v === 'income') return 'ingreso';
  if (v === 'gasto' || v === 'expense') return 'gasto';
  throw new BadRequestError('Tipo de categoría inválido. Use "income"/"expense" o "ingreso"/"gasto".');
}

async function list(userId) {
  return await models.Category.findAll({
    attributes: ['id', 'name', 'type', ['include_in_stats', 'includeInStats'], 'icon', 'color', ['color_name', 'colorName'], ['user_id', 'userId']],
    where: { userId },
    order: [['type', 'ASC'], ['name', 'ASC']],
    raw: true,
  });
}

async function create(userId, { name, type, icon, color, colorName, includeInStats = true }) {
  const dbType = normalizeType(type);
  const created = await models.Category.create({ name, type: dbType, icon, color, colorName, includeInStats, userId });
  return { id: created.id };
}

async function update(categoryId, userId, { name, type, icon, color, colorName, includeInStats }) {
  const cat = await models.Category.findOne({ where: { id: categoryId, userId } });
  if (!cat) return null;
  const updates = {};
  if (typeof name === 'string') updates.name = name;
  if (typeof icon === 'string') updates.icon = icon;
  if (typeof color === 'string') updates.color = color;
  if (typeof colorName === 'string') updates.colorName = colorName;
  if (typeof type !== 'undefined' && type !== null) updates.type = normalizeType(type);
  if (typeof includeInStats === 'boolean') updates.includeInStats = includeInStats;
  if (Object.keys(updates).length === 0) return { id: categoryId };
  await cat.update(updates);
  return { id: categoryId };
}

async function remove(categoryId, userId) {
  const count = await models.Category.destroy({ where: { id: categoryId, userId } });
  return { rowCount: count };
}
async function listByIncludeInStats(userId, include) {
  return await models.Category.findAll({
    attributes: ['id', 'name', 'type', ['include_in_stats', 'includeInStats'], 'icon', 'color', ['color_name', 'colorName'], ['user_id', 'userId']],
    where: { userId, includeInStats: !!include },
    order: [['type', 'ASC'], ['name', 'ASC']],
    raw: true,
  });
}

async function listFiltered(userId, { includeInStats, type } = {}) {
  const where = { userId };
  if (typeof includeInStats === 'boolean') where.includeInStats = includeInStats;
  if (typeof type !== 'undefined' && type !== null) where.type = normalizeType(type);
  return await models.Category.findAll({
    attributes: ['id', 'name', 'type', ['include_in_stats', 'includeInStats'], 'icon', 'color', ['color_name', 'colorName'], ['user_id', 'userId']],
    where,
    order: [['type', 'ASC'], ['name', 'ASC']],
    raw: true,
  });
}

async function bulkSetIncludeInStats(userId, ids, value) {
  const uniqueIds = Array.from(new Set((ids || []).map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n) && n > 0)));
  if (uniqueIds.length === 0) return { rowCount: 0 };
  const [count] = await models.Category.update(
    { includeInStats: !!value },
    { where: { userId, id: uniqueIds } },
  );
  return { rowCount: count };
}

module.exports = { list, create, update, remove, listByIncludeInStats, bulkSetIncludeInStats, listFiltered };
