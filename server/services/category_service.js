const { models } = require('../libs/sequelize');

async function list(userId) {
  return await models.Category.findAll({
    attributes: ['id', 'name', 'type', 'icon', 'color', ['color_name', 'colorName'], ['user_id', 'userId']],
    where: { userId },
    order: [['type', 'ASC'], ['name', 'ASC']],
    raw: true,
  });
}

async function create(userId, { name, type, icon, color, colorName }) {
  const created = await models.Category.create({ name, type, icon, color, colorName, userId });
  return { id: created.id };
}

async function update(categoryId, userId, { name, type, icon, color, colorName }) {
  const cat = await models.Category.findOne({ where: { id: categoryId, userId } });
  if (!cat) return null;
  await cat.update({ name, type, icon, color, colorName });
  return { id: categoryId };
}

async function remove(categoryId, userId) {
  const count = await models.Category.destroy({ where: { id: categoryId, userId } });
  return { rowCount: count };
}

module.exports = { list, create, update, remove };
