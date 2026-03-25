const { models, sequelize } = require('../libs/sequelize');
const txService = require('./transaction_service');

async function list(userId) {
  const rows = await models.Account.findAll({
    attributes: ['id', 'name', 'type', 'currency', 'balance', ['user_id', 'userId']],
    where: { userId },
    order: [['name', 'ASC']],
    raw: true,
  });
  return rows;
}

async function create(userId, { name, type = 'efectivo', currency, balance = 0 }) {
  const created = await models.Account.create({ name, type, currency, balance, userId });
  return { id: created.id };
}

async function update(accountId, userId, payload) {
  const account = await models.Account.findOne({ where: { id: accountId, userId } });
  if (!account) return null;

  const updates = {};
  if (typeof payload.name === 'string') updates.name = payload.name;
  if (typeof payload.currency === 'string') updates.currency = payload.currency;
  if (Object.keys(updates).length) await account.update(updates);

  if (payload.balance !== undefined && payload.balance !== null && payload.balance !== '') {
    const newBalance = Number(payload.balance);
    const delta = newBalance - Number(account.balance);
    if (delta !== 0) {
      const adjType = delta > 0 ? 'ingreso' : 'gasto';
      const adjName = adjType === 'ingreso' ? 'Ajuste de Balance (+)' : 'Ajuste de Balance (-)';
      let categoryId;
      const cat = await models.Category.findOne({ where: { userId, name: adjName, type: adjType } });
      if (cat) categoryId = cat.id;
      else {
        const group = await models.CategoryGroup.findOne({
          where: { userId, analyticsBehavior: 'exclude' },
          order: [['id', 'ASC']],
        });
        const createdCat = await models.Category.create({
          userId,
          name: adjName,
          type: adjType,
          icon: 'Wrench',
          color: '#94a3b8',
          colorName: 'Slate',
          groupId: group?.id || null,
          isSystem: true,
        });
        categoryId = createdCat.id;
      }
      const currencyToUse = typeof payload.currency === 'string' ? payload.currency : account.currency;
      await txService.createTransaction(userId, {
        description: 'Ajuste de Balance',
        amount: Math.abs(delta),
        currency: currencyToUse,
        date: new Date().toISOString().split('T')[0],
        categoryId,
        accountId,
      });
    }
  }

  return { id: accountId };
}

async function remove(accountId, userId) {
  const count = await models.Account.destroy({ where: { id: accountId, userId } });
  return { rowCount: count };
}

module.exports = { list, create, update, remove };
