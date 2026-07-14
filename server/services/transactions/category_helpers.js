const { Op } = require('sequelize');
const { models } = require('../../libs/sequelize');

async function findOrCreateCategoryByName(userId, name, type, t, defaults = {}) {
  const normalizedType = type === 'income' || type === 'ingreso' ? 'ingreso' : 'gasto';
  let cat = await models.Category.findOne({ where: { userId, type: normalizedType, name: { [Op.iLike]: name } }, transaction: t });
  if (cat) return cat;
  cat = await models.Category.create({ userId, name, type: normalizedType, ...defaults }, { transaction: t });
  return cat;
}

async function findCategoryGroupIdByBehavior(userId, analyticsBehavior, t) {
  const group = await models.CategoryGroup.findOne({
    where: { userId, analyticsBehavior },
    order: [['id', 'ASC']],
    transaction: t,
  });
  return group?.id || null;
}

module.exports = { findOrCreateCategoryByName, findCategoryGroupIdByBehavior };
