const axios = require('axios');
const { Op, fn, col, where: sqWhere, literal } = require('sequelize');
const { sequelize, models } = require('../libs/sequelize');

function parseIdFilter(input) {
  if (!input) return null;
  const parts = Array.isArray(input) ? input : String(input).split(',');
  const ids = parts
    .map((s) => parseInt(String(s).trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return null;
  // unique
  return Array.from(new Set(ids));
}

async function getVesPerUsdByDate(date) {
  const targetDate = date ? new Date(date) : new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(targetDate);
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    try {
      const response = await axios.get(`https://api.dolarvzla.com/public/exchange-rate/list?from=${dateString}&to=${dateString}`);
      if (response.data && response.data.rates && response.data.rates.length > 0 && response.data.rates[0].usd) {
        return response.data.rates[0].usd;
      }
    } catch (err) { /* ignore and continue */ }
  }
  return 150;
}

async function getAllTransactions(filters) {
  const { userId, q, type, categoryId, accountId, date } = filters;
  const whereTx = { userId };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  if (date) whereTx.date = date;

  const include = [];
  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  if (q) {
    whereTx[Op.or] = [
      { description: { [Op.iLike]: `%${q}%` } },
      sqWhere(col('Category.name'), { [Op.iLike]: `%${q}%` })
    ];
  }
  include.push({ model: models.Category, attributes: ['type', 'name'], where: Object.keys(catWhere).length ? catWhere : undefined, required: false });

  const rows = await models.Transaction.findAll({
    attributes: ['id', 'description', 'amount', 'currency', ['amount_usd', 'amountUsd'], ['exchange_rate_used', 'exchangeRateUsed'], 'date', ['category_id', 'categoryId'], ['account_id', 'accountId']],
    where: whereTx,
    include,
    order: [['date', 'DESC'], ['id', 'DESC']],
    raw: true,
    nest: true,
  });

  return rows.map(r => ({
    id: r.id,
    description: r.description,
    amount: r.amount,
    currency: r.currency,
    amountUsd: r.amountUsd,
    exchangeRateUsed: r.exchangeRateUsed,
    date: r.date,
    categoryId: r.categoryId,
    accountId: r.accountId,
    type: r.Category?.type,
  }));
}

async function getGroupedTransactions(filters) {
  const { userId, pageSize = 20, cursorDate, q, type, categoryId, accountId, date } = filters;
  const whereTx = { userId };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  if (date) whereTx.date = date;
  if (cursorDate) whereTx.date = { [Op.lt]: cursorDate };

  const include = [];
  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  if (q) {
    whereTx[Op.or] = [
      { description: { [Op.iLike]: `%${q}%` } },
      sqWhere(col('Category.name'), { [Op.iLike]: `%${q}%` })
    ];
  }
  include.push({ model: models.Category, attributes: ['type', 'name'], where: Object.keys(catWhere).length ? catWhere : undefined, required: false });

  // For day counts, avoid selecting Category columns to prevent GROUP BY issues
  const includeDay = [{ model: models.Category, attributes: [], where: Object.keys(catWhere).length ? catWhere : undefined, required: false }];
  const dayRows = await models.Transaction.findAll({
    attributes: [[fn('DATE', col('Transaction.date')), 'day'], [fn('COUNT', col('Transaction.id')), 'tx_count']],
    where: whereTx,
    include: includeDay,
    group: [fn('DATE', col('Transaction.date'))],
    order: [[literal('day'), 'DESC']],
    raw: true,
  });

  const days = [];
  let cumulative = 0;
  for (const row of dayRows) {
    const count = parseInt(row.tx_count);
    if ((cumulative + count) <= pageSize) {
      days.push(row.day);
      cumulative += count;
    } else if (cumulative === 0) {
      days.push(row.day);
      break;
    } else {
      break;
    }
  }
  if (days.length === 0 && dayRows.length > 0) days.push(dayRows[0].day);

  const items = await models.Transaction.findAll({
    attributes: ['id', 'description', 'amount', 'currency', ['amount_usd', 'amountUsd'], ['exchange_rate_used', 'exchangeRateUsed'], 'date', ['category_id', 'categoryId'], ['account_id', 'accountId']],
    where: { ...whereTx, ...(days.length ? { date: { [Op.in]: days } } : {}) },
    include: [{ model: models.Category, attributes: ['type'], required: true }],
    order: [['date', 'DESC'], ['id', 'DESC']],
    raw: true,
    nest: true,
  });

  let nextCursorDate = null;
  if (items.length > 0) {
    const lastDate = items[items.length - 1].date;
    const hasMore = await models.Transaction.findOne({
      attributes: ['id'],
      where: { ...whereTx, date: { [Op.lt]: lastDate } },
      include,
    });
    if (hasMore) nextCursorDate = lastDate;
  }

  const shaped = items.map(it => ({
    id: it.id,
    description: it.description,
    amount: it.amount,
    currency: it.currency,
    amountUsd: it.amountUsd,
    exchangeRateUsed: it.exchangeRateUsed,
    date: it.date,
    categoryId: it.categoryId,
    accountId: it.accountId,
    type: it.Category?.type,
  }));

  return { items: shaped, hasMore: nextCursorDate !== null, nextCursorDate };
}

async function createTransaction(userId, txData) {
  const { description, amount, currency, date, categoryId, accountId } = txData;
  let amountUsd = null;
  let exchangeRateUsed = null;
  if (currency === 'VES') {
    exchangeRateUsed = await getVesPerUsdByDate(date);
    amountUsd = Number(amount) / Number(exchangeRateUsed);
  } else if (currency === 'USD') {
    amountUsd = amount;
  }
  return await sequelize.transaction(async (t) => {
    const category = await models.Category.findOne({ where: { id: categoryId, userId }, transaction: t });
    if (!category) throw new Error('Categoría no válida o no pertenece al usuario.');
    const categoryType = category.type; // 'ingreso' | 'gasto'
    const delta = categoryType === 'ingreso' ? amount : -amount;

    const account = await models.Account.findOne({ where: { id: accountId, userId }, transaction: t });
    if (!account) throw new Error('Cuenta no válida o no pertenece al usuario.');
    const newBalance = Number(account.balance) + Number(delta);
    await account.update({ balance: newBalance }, { transaction: t });

    const created = await models.Transaction.create({
      description,
      amount,
      currency,
      amountUsd,
      exchangeRateUsed,
      date,
      categoryId,
      accountId,
      userId,
    }, { transaction: t });

    return { tx: {
      id: created.id,
      description: created.description,
      amount: created.amount,
      currency: created.currency,
      amountUsd: created.amountUsd,
      exchangeRateUsed: created.exchangeRateUsed,
      date: created.date,
      categoryId: created.categoryId,
      accountId: created.accountId,
      type: categoryType === 'ingreso' ? 'income' : 'expense',
    }};
  });
}

async function updateTransaction(txId, userId, txData) {
  const { description, amount, date, categoryId, accountId, currency } = txData;
  const categoryIdNum = categoryId != null ? parseInt(categoryId) : undefined;
  const accountIdNum = accountId != null ? parseInt(accountId) : undefined;

  return await sequelize.transaction(async (t) => {
    const oldTx = await models.Transaction.findOne({ where: { id: txId, userId }, transaction: t });
    if (!oldTx) return null;

    const newDescription = typeof description === 'string' ? description : oldTx.description;
    const newAmount = amount != null ? Number(amount) : Number(oldTx.amount);
    const newCurrency = typeof currency === 'string' ? currency : oldTx.currency;
    const newDate = date ? date : oldTx.date;
    const newCategoryId = categoryIdNum != null ? categoryIdNum : oldTx.categoryId;
    const newAccountId = accountIdNum != null ? accountIdNum : oldTx.accountId;

    const oldCategoryType = (await models.Category.findByPk(oldTx.categoryId, { transaction: t }))?.type;
    const oldDelta = oldCategoryType === 'ingreso' ? -Number(oldTx.amount) : Number(oldTx.amount);
    const oldAccount = await models.Account.findOne({ where: { id: oldTx.accountId, userId }, transaction: t });
    if (oldAccount) await oldAccount.update({ balance: Number(oldAccount.balance) + oldDelta }, { transaction: t });

    const newCategory = await models.Category.findOne({ where: { id: newCategoryId, userId }, transaction: t });
    if (!newCategory) throw new Error('Nueva categoría no es válida.');
    const newCategoryType = newCategory.type;

    const newAccount = await models.Account.findOne({ where: { id: newAccountId, userId }, transaction: t });
    if (!newAccount) throw new Error('Cuenta no válida.');

    const newDelta = newCategoryType === 'ingreso' ? Number(newAmount) : -Number(newAmount);
    await newAccount.update({ balance: Number(newAccount.balance) + newDelta }, { transaction: t });

    let amountUsd = null;
    let exchangeRateUsed = null;
    if (newCurrency === 'VES') {
      exchangeRateUsed = await getVesPerUsdByDate(newDate);
      amountUsd = Number(newAmount) / Number(exchangeRateUsed);
    } else if (newCurrency === 'USD') {
      amountUsd = newAmount;
    }

    await oldTx.update({
      description: newDescription,
      amount: newAmount,
      currency: newCurrency,
      date: newDate,
      categoryId: newCategoryId,
      accountId: newAccountId,
      amountUsd,
      exchangeRateUsed,
    }, { transaction: t });

    return { tx: {
      id: oldTx.id,
      description: oldTx.description,
      amount: oldTx.amount,
      currency: oldTx.currency,
      date: oldTx.date,
      categoryId: oldTx.categoryId,
      accountId: oldTx.accountId,
      amountUsd: oldTx.amountUsd,
      exchangeRateUsed: oldTx.exchangeRateUsed,
      type: newCategoryType === 'ingreso' ? 'income' : 'expense',
    }};
  });
}

async function deleteTransaction(txId, userId) {
  return await sequelize.transaction(async (t) => {
    const oldTx = await models.Transaction.findOne({ where: { id: txId, userId }, transaction: t });
    if (!oldTx) return { rowCount: 0 };

    const oldCategoryType = (await models.Category.findByPk(oldTx.categoryId, { transaction: t }))?.type;
    const oldDelta = oldCategoryType === 'ingreso' ? -Number(oldTx.amount) : Number(oldTx.amount);
    const account = await models.Account.findOne({ where: { id: oldTx.accountId, userId }, transaction: t });
    if (account) await account.update({ balance: Number(account.balance) + oldDelta }, { transaction: t });

    await oldTx.destroy({ transaction: t });
    return { rowCount: 1 };
  });
}

module.exports = {
  getVesPerUsdByDate,
  getAllTransactions,
  getGroupedTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
