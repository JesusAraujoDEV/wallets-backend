const { Op } = require('sequelize');
const { models } = require('../../libs/sequelize');

function shapeHydratedTransferTx(row) {
  const category = row.Category || null;
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    currency: row.currency,
    amountUsd: row.amountUsd,
    exchangeRateUsed: row.exchangeRateUsed,
    date: row.date,
    status: row.status,
    categoryId: row.categoryId,
    accountId: row.accountId,
    type: category?.type === 'ingreso' ? 'income' : 'expense',
    category: category ? {
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      colorName: category.colorName,
    } : null,
  };
}

async function getHydratedTransferTransactionsInT(t, userId, orderedIds) {
  const filteredIds = orderedIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (!filteredIds.length) return [];

  const rows = await models.Transaction.findAll({
    where: { userId, id: { [Op.in]: filteredIds } },
    include: [{
      model: models.Category,
      attributes: ['id', 'name', 'type', 'icon', 'color', 'colorName'],
      paranoid: false,
    }],
    transaction: t,
  });

  const byId = new Map(rows.map((row) => [Number(row.id), shapeHydratedTransferTx(row)]));
  return filteredIds.map((id) => byId.get(id)).filter(Boolean);
}

module.exports = { shapeHydratedTransferTx, getHydratedTransferTransactionsInT };
