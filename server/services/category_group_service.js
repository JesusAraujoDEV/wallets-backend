const { models } = require('../libs/sequelize');

async function list(userId) {
  return await models.CategoryGroup.findAll({
    attributes: ['id', 'name', 'type', ['analytics_behavior', 'analyticsBehavior'], ['user_id', 'userId']],
    where: { userId },
    order: [['type', 'ASC'], ['name', 'ASC'], ['id', 'ASC']],
    raw: true,
  });
}

module.exports = { list };