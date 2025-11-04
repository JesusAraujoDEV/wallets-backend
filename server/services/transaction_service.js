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

function monthToRange(monthStr) {
  // monthStr expected 'YYYY-MM'
  if (!monthStr || typeof monthStr !== 'string') return null;
  const [y, m] = monthStr.split('-').map((v) => parseInt(v, 10));
  if (!y || !m || m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day of month
  const toISO = (d) => d.toISOString().slice(0, 10);
  return { from: toISO(start), to: toISO(end) };
}

async function getAllTransactions(filters) {
  const { userId, q, type, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats } = filters;
  const whereTx = { userId };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  // date filters: range or single day
  const monthRange = monthToRange(month);
  const from = dateFrom || monthRange?.from || null;
  const to = dateTo || monthRange?.to || null;
  if (from || to) {
    whereTx.date = {};
    if (from) whereTx.date[Op.gte] = from;
    if (to) whereTx.date[Op.lte] = to;
  } else if (date) {
    whereTx.date = date;
  }

  const include = [];
  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  if (typeof includeInStats !== 'undefined' && includeInStats !== null) {
    const v = String(includeInStats).toLowerCase();
    const bool = v === '1' || v === 'true' || v === 'yes' || includeInStats === true;
    catWhere.includeInStats = bool;
  }
  if (q) {
    whereTx[Op.or] = [
      { description: { [Op.iLike]: `%${q}%` } },
      sqWhere(col('Category.name'), { [Op.iLike]: `%${q}%` })
    ];
  }
  // If filtering by category type, make the join required so non-matching categories are excluded
  include.push({
    model: models.Category,
    attributes: ['type', 'name'],
    where: Object.keys(catWhere).length ? catWhere : undefined,
    required: Object.keys(catWhere).length > 0,
  });

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
  const { userId, pageSize = 20, cursorDate, q, type, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats } = filters;
  const whereTx = { userId };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  // Build date clause (range, single day, and pagination upper bound)
  const monthRange = monthToRange(month);
  const from = dateFrom || monthRange?.from || null;
  const to = dateTo || monthRange?.to || null;
  if (from || to) {
    whereTx.date = {};
    if (from) whereTx.date[Op.gte] = from;
    if (to) whereTx.date[Op.lte] = to;
  } else if (date) {
    whereTx.date = date;
  }
  if (cursorDate) {
    if (typeof whereTx.date === 'object' && whereTx.date !== null) {
      whereTx.date[Op.lt] = cursorDate;
    } else if (!whereTx.date) {
      whereTx.date = { [Op.lt]: cursorDate };
    } // if exact date present, we keep it (cursorDate irrelevant for a single day)
  }

  const include = [];
  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  if (typeof includeInStats !== 'undefined' && includeInStats !== null) {
    const v = String(includeInStats).toLowerCase();
    const bool = v === '1' || v === 'true' || v === 'yes' || includeInStats === true;
    catWhere.includeInStats = bool;
  }
  if (q) {
    whereTx[Op.or] = [
      { description: { [Op.iLike]: `%${q}%` } },
      sqWhere(col('Category.name'), { [Op.iLike]: `%${q}%` })
    ];
  }
  include.push({ model: models.Category, attributes: ['type', 'name'], where: Object.keys(catWhere).length ? catWhere : undefined, required: Object.keys(catWhere).length > 0 });

  // For day counts, avoid selecting Category columns to prevent GROUP BY issues
  const includeDay = [{ model: models.Category, attributes: [], where: Object.keys(catWhere).length ? catWhere : undefined, required: Object.keys(catWhere).length > 0 }];
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
    include: [{ model: models.Category, attributes: ['type'], where: Object.keys(catWhere).length ? catWhere : undefined, required: Object.keys(catWhere).length > 0 }],
    order: [['date', 'DESC'], ['id', 'DESC']],
    raw: true,
    nest: true,
  });

  let nextCursorDate = null;
  if (items.length > 0) {
    const lastDate = items[items.length - 1].date;
    // Build hasMore date clause respecting lower bound (from/dateFrom/month)
    let hasMoreDateClause = { [Op.lt]: lastDate };
    if (typeof whereTx.date === 'object' && whereTx.date !== null) {
      const lowerOps = {};
      if (whereTx.date[Op.gte]) lowerOps[Op.gte] = whereTx.date[Op.gte];
      if (whereTx.date[Op.lte]) lowerOps[Op.lte] = whereTx.date[Op.lte];
      hasMoreDateClause = { ...lowerOps, [Op.lt]: lastDate };
    }
    const hasMore = await models.Transaction.findOne({
      attributes: ['id'],
      where: { ...whereTx, date: hasMoreDateClause },
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

async function createTransactionInT(t, userId, txData) {
  const { description, amount, currency, date, categoryId, accountId } = txData;
  let amountUsd = null;
  let exchangeRateUsed = null;
  if (currency === 'VES') {
    exchangeRateUsed = await getVesPerUsdByDate(date);
    amountUsd = Number(amount) / Number(exchangeRateUsed);
  } else if (currency === 'USD') {
    amountUsd = amount;
  }

  const category = await models.Category.findOne({ where: { id: categoryId, userId }, transaction: t });
  if (!category) throw new Error('Categoría no válida o no pertenece al usuario.');
  const categoryType = category.type; // 'ingreso' | 'gasto'
  const delta = categoryType === 'ingreso' ? Number(amount) : -Number(amount);

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
}

async function createTransaction(userId, txData) {
  return await sequelize.transaction(async (t) => {
    const main = await createTransactionInT(t, userId, txData);

    const comm = Number(txData?.commission || 0);
    let commissionTx = null;
    if (comm && comm > 0) {
      const catCommission = await findOrCreateCategoryByName(userId, 'comision', 'gasto', t, { icon: 'ReceiptText', color: '#6B7280', colorName: 'Gray' });
      const descCom = `Comision de: ${txData.description}`;
      const commission = await createTransactionInT(t, userId, {
        description: descCom,
        amount: comm,
        currency: txData.currency,
        date: txData.date,
        categoryId: catCommission.id,
        accountId: txData.accountId,
      });
      commissionTx = commission.tx;
    }

    return { tx: main.tx, commissionTx };
  });
}

async function findOrCreateCategoryByName(userId, name, type, t, defaults = {}) {
  const normalizedType = type === 'income' || type === 'ingreso' ? 'ingreso' : 'gasto';
  let cat = await models.Category.findOne({ where: { userId, type: normalizedType, name: { [Op.iLike]: name } }, transaction: t });
  if (cat) return cat;
  cat = await models.Category.create({ userId, name, type: normalizedType, ...defaults }, { transaction: t });
  return cat;
}

async function createTransfer(userId, payload) {
  const {
    fromAccountId,
    toAccountId,
    amount,
    commission = 0,
    date,
    concept = '',
  } = payload || {};

  const fromId = parseInt(fromAccountId, 10);
  const toId = parseInt(toAccountId, 10);
  const amt = Number(amount);
  const comm = Number(commission || 0);
  if (!fromId || !toId || Number.isNaN(fromId) || Number.isNaN(toId)) throw new Error('Parámetros de cuentas inválidos.');
  if (fromId === toId) throw new Error('La cuenta origen y destino deben ser diferentes.');
  if (!amt || amt <= 0) throw new Error('El monto de la transferencia debe ser mayor a 0.');
  if (!date) throw new Error('La fecha es requerida.');
  if (comm < 0) throw new Error('La comisión no puede ser negativa.');

  return await sequelize.transaction(async (t) => {
    const fromAccount = await models.Account.findOne({ where: { id: fromId, userId }, transaction: t });
    const toAccount = await models.Account.findOne({ where: { id: toId, userId }, transaction: t });
    if (!fromAccount) throw new Error('Cuenta origen no válida o no pertenece al usuario.');
    if (!toAccount) throw new Error('Cuenta destino no válida o no pertenece al usuario.');

    if (fromAccount.currency !== toAccount.currency) {
      throw new Error('Las transferencias entre cuentas de distinta moneda aún no están soportadas.');
    }

    // Categories: Transfer out (expense), Transfer in (income), Commission (expense)
    const catOut = await findOrCreateCategoryByName(userId, 'Transferencia', 'gasto', t, { icon: 'ArrowUpRight', color: '#F59E0B', colorName: 'Amber' });
    const catIn = await findOrCreateCategoryByName(userId, 'Transferencia', 'ingreso', t, { icon: 'ArrowDownLeft', color: '#10B981', colorName: 'Emerald' });
    const catCommission = await findOrCreateCategoryByName(userId, 'comision', 'gasto', t, { icon: 'ReceiptText', color: '#6B7280', colorName: 'Gray' });

    // Build canonical descriptions
    const descOut = concept && concept.trim().length
      ? `Transferencia a ${toAccount.name}: ${concept}`
      : `Transferencia a ${toAccount.name}`;
    const descIn = concept && concept.trim().length
      ? `Transferencia desde ${fromAccount.name}: ${concept}`
      : `Transferencia desde ${fromAccount.name}`;
    const descCom = `Comision de la transferencia de la cuenta ${fromAccount.name} a la cuenta ${toAccount.name} con concepto de: "${concept || ''}"`;

    // Idempotency/dedup: if an identical set was created very recently, return it instead of duplicating
    const recentSince = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes window
    const existingOut = await models.Transaction.findOne({
      where: {
        userId,
        accountId: fromAccount.id,
        categoryId: catOut.id,
        amount: amt,
        date,
        description: descOut,
        createdAt: { [Op.gte]: recentSince },
      },
      include: [{ model: models.Category, attributes: ['type'] }],
      order: [['id', 'DESC']],
      transaction: t,
    });
    const existingIn = await models.Transaction.findOne({
      where: {
        userId,
        accountId: toAccount.id,
        categoryId: catIn.id,
        amount: amt,
        date,
        description: descIn,
        createdAt: { [Op.gte]: recentSince },
      },
      include: [{ model: models.Category, attributes: ['type'] }],
      order: [['id', 'DESC']],
      transaction: t,
    });
    const existingCom = comm > 0 ? await models.Transaction.findOne({
      where: {
        userId,
        accountId: fromAccount.id,
        categoryId: catCommission.id,
        amount: comm,
        date,
        description: descCom,
        createdAt: { [Op.gte]: recentSince },
      },
      include: [{ model: models.Category, attributes: ['type'] }],
      order: [['id', 'DESC']],
      transaction: t,
    }) : null;

    if (existingOut && existingIn && ((comm > 0 && existingCom) || comm === 0)) {
      const shape = (row) => ({
        id: row.id,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        amountUsd: row.amountUsd,
        exchangeRateUsed: row.exchangeRateUsed,
        date: row.date,
        categoryId: row.categoryId,
        accountId: row.accountId,
        type: row.Category?.type === 'ingreso' ? 'income' : 'expense',
      });
      return {
        outTx: shape(existingOut),
        inTx: shape(existingIn),
        commissionTx: existingCom ? shape(existingCom) : null,
      };
    }

    // 1) Expense from origin
    const outTx = await createTransactionInT(t, userId, {
      description: descOut,
      amount: amt,
      currency: fromAccount.currency,
      date,
      categoryId: catOut.id,
      accountId: fromAccount.id,
    });

    // 2) Income to destination
    const inTx = await createTransactionInT(t, userId, {
      description: descIn,
      amount: amt,
      currency: toAccount.currency,
      date,
      categoryId: catIn.id,
      accountId: toAccount.id,
    });

    // 3) Commission expense (if any)
    let commissionTx = null;
    if (comm && comm > 0) {
      commissionTx = await createTransactionInT(t, userId, {
        description: descCom,
        amount: comm,
        currency: fromAccount.currency,
        date,
        categoryId: catCommission.id,
        accountId: fromAccount.id,
      });
    }

    return {
      outTx: outTx.tx,
      inTx: inTx.tx,
      commissionTx: commissionTx ? commissionTx.tx : null,
    };
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

// Summary helpers
function parseBoolish(val) {
  if (val === undefined || val === null) return null;
  const v = String(val).toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes') return true;
  if (v === '0' || v === 'false' || v === 'no') return false;
  return null;
}

function buildTxFilterWhere({ userId, q, categoryId, accountId, date, dateFrom, dateTo, month }) {
  const whereTx = { userId };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];

  const monthRange = monthToRange(month);
  const from = dateFrom || monthRange?.from || null;
  const to = dateTo || monthRange?.to || null;
  if (from || to) {
    whereTx.date = {};
    if (from) whereTx.date[Op.gte] = from;
    if (to) whereTx.date[Op.lte] = to;
  } else if (date) {
    whereTx.date = date;
  }
  if (q) {
    whereTx[Op.or] = [
      { description: { [Op.iLike]: `%${q}%` } },
      sqWhere(col('Category.name'), { [Op.iLike]: `%${q}%` })
    ];
  }
  return whereTx;
}

async function getTransactionsSummary({ userId, type, q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats }) {
  const whereTx = buildTxFilterWhere({ userId, q, categoryId, accountId, date, dateFrom, dateTo, month });
  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  const bool = parseBoolish(includeInStats);
  if (bool !== null) catWhere.includeInStats = bool;

  const sumRow = await models.Transaction.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('Transaction.amount_usd')), 0), 'totalUsd']],
    where: whereTx,
    include: [{ model: models.Category, attributes: [], where: Object.keys(catWhere).length ? catWhere : undefined, required: Object.keys(catWhere).length > 0 }],
    raw: true,
  });
  const total = Number(sumRow?.totalUsd || 0);

  // Reuse existing list function ensuring the type filter is applied
  const items = await getAllTransactions({ userId, q, type, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });

  if (type === 'income') {
    return { income_total: total, transactions_income: items };
  } else {
    return { expense_total: total, transactions_expense: items };
  }
}

async function getBalanceSummary({ userId, q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats }) {
  const ids = parseIdFilter(accountId);
  const whereAcc = { userId };
  if (ids && ids.length > 0) whereAcc.id = ids.length > 1 ? { [Op.in]: ids } : ids[0];

  // Fetch accounts (filtered if ids present)
  const accounts = await models.Account.findAll({ where: whereAcc, raw: true });
  const rate = await getVesPerUsdByDate();

  // If a single account id is provided, return only that account's USD balance in a simplified shape
  if (ids && ids.length === 1) {
    const acc = accounts.find(a => Number(a.id) === Number(ids[0]));
    if (!acc) {
      return { single: true, balance_usd: 0 };
    }
    const bal = Number(acc.balance || 0);
    const balance_usd = acc.currency === 'VES' ? bal / Number(rate) : bal;
    return { single: true, balance_usd };
  }

  // Otherwise sum account balances converted to USD
  let accounts_total_usd = 0;
  for (const acc of accounts) {
    const bal = Number(acc.balance || 0);
    if (acc.currency === 'VES') accounts_total_usd += bal / Number(rate);
    else accounts_total_usd += bal; // treat USD/USDT equivalent
  }

  // Income and expense totals in USD over the requested range
  const income = await getTransactionsSummary({ userId, type: 'income', q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
  const expense = await getTransactionsSummary({ userId, type: 'expense', q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
  const income_total_usd = Number(income.income_total || 0);
  const expense_total_usd = Number(expense.expense_total || 0);
  const net_total_usd = income_total_usd - expense_total_usd;

  return {
    single: false,
    accounts_total_usd,
    income_total_usd,
    expense_total_usd,
    net_total_usd,
  };
}

function parseMonthStr(m) {
  if (!m || typeof m !== 'string') return null;
  const m2 = m.trim();
  const match = m2.match(/^\d{4}-\d{2}$/);
  if (!match) return null;
  const [y, mo] = m2.split('-').map(n => parseInt(n, 10));
  if (mo < 1 || mo > 12) return null;
  return { y, mo };
}

function monthRangeInclusive(fromMonth, toMonth) {
  const a = parseMonthStr(fromMonth);
  const b = toMonth ? parseMonthStr(toMonth) : a;
  if (!a || !b) return null;
  const fromDate = new Date(Date.UTC(a.y, a.mo - 1, 1));
  const toDate = new Date(Date.UTC(b.y, b.mo, 0));
  if (toDate < fromDate) return null;
  return { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) };
}

function monthsBetweenList(fromMonth, toMonth) {
  const a = parseMonthStr(fromMonth);
  const b = toMonth ? parseMonthStr(toMonth) : a;
  if (!a || !b) return [];
  const out = [];
  let y = a.y, m = a.mo;
  while (y < b.y || (y === b.y && m <= b.mo)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

async function getMonthlySummary({ userId, type, fromMonth, toMonth, includeInStats, categoryId, accountId }) {
  const range = monthRangeInclusive(fromMonth, toMonth);
  if (!range) throw new Error('Parámetros from_month/to_month inválidos. Formato esperado YYYY-MM y from <= to.');

  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  const bool = parseBoolish(includeInStats);
  if (bool !== null) catWhere.includeInStats = bool;

  // Build tx where with optional filters
  const whereTx = { userId, date: { [Op.gte]: range.from, [Op.lte]: range.to } };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];

  const rows = await models.Transaction.findAll({
    attributes: [
      [fn('date_trunc', 'month', col('Transaction.date')), 'month_dt'],
      [fn('COALESCE', fn('SUM', col('Transaction.amount_usd')), 0), 'sum_usd'],
    ],
    where: whereTx,
    include: [{ model: models.Category, attributes: [], where: Object.keys(catWhere).length ? catWhere : undefined, required: true }],
    group: [fn('date_trunc', 'month', col('Transaction.date'))],
    order: [[fn('date_trunc', 'month', col('Transaction.date')), 'ASC']],
    raw: true,
  });

  const months = monthsBetweenList(fromMonth, toMonth);
  const map = {};
  for (const m of months) map[m] = 0;
  for (const r of rows) {
    const dt = r.month_dt instanceof Date ? r.month_dt : new Date(r.month_dt);
    const ym = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
    map[ym] = Number(r.sum_usd || 0);
  }

  const prefix = type === 'income' ? 'income_' : 'expense_';
  const obj = {};
  let total = 0;
  for (const m of months) {
    obj[`${prefix}${m}`] = map[m] || 0;
    total += map[m] || 0;
  }

  if (type === 'income') {
    return { income_total: total, income: [obj] };
  }
  return { expense_total: total, expense: [obj] };
}

// Export helpers
async function getTransferExportRows({ userId, fromDate, toDate, accountId, includeCommission = false, createdBy }) {
  const whereTx = { userId };
  if (fromDate || toDate) {
    whereTx.date = {};
    if (fromDate) whereTx.date[Op.gte] = fromDate;
    if (toDate) whereTx.date[Op.lte] = toDate;
  }
  if (accountId) {
    const idNum = parseInt(accountId, 10);
    if (!Number.isNaN(idNum)) whereTx.accountId = idNum;
  }

  const catWhere = includeCommission
    ? { [Op.or]: [
        { name: { [Op.iLike]: 'transferencia' } },
        { name: { [Op.iLike]: 'comision' } },
      ] }
    : { name: { [Op.iLike]: 'transferencia' } };

  const txs = await models.Transaction.findAll({
    where: whereTx,
    include: [
      { model: models.Category, attributes: ['id','name','type'], where: catWhere, required: true },
      { model: models.Account, attributes: ['id','name','currency'], required: false },
    ],
    order: [['date', 'ASC'], ['id', 'ASC']],
    raw: true,
    nest: true,
  });

  const rows = [];
  for (const t of txs) {
    const catName = String(t.Category?.name || '').toLowerCase();
    const catType = t.Category?.type;
    const desc = t.description || '';
    const amt = Number(t.amount || 0);
    const date = t.date;
    const accountName = t.Account?.name || '';
    const currency = t.Account?.currency || t.currency;

    if (catName === 'comision') {
      rows.push({
        id: t.id,
        date,
        from_account: accountName || null,
        to_account: null,
        currency,
        amount: amt,
        commission: amt,
        concept: desc,
        created_by: createdBy,
      });
      continue;
    }

    // Only use expense-side transfer as canonical row
    if (catType === 'gasto') {
      let toAccount = null;
      const m = desc.match(/Transferencia a ([^:]+)(?:[:]\s*(.*))?/i);
      if (m) toAccount = (m[1] || '').trim();
      rows.push({
        id: t.id,
        date,
        from_account: accountName || null,
        to_account: toAccount,
        currency,
        amount: amt,
        commission: 0,
        concept: desc,
        created_by: createdBy,
      });
    }
  }

  return rows;
}

module.exports = {
  getVesPerUsdByDate,
  getAllTransactions,
  getGroupedTransactions,
  getTransactionsSummary,
  getMonthlySummary,
  getBalanceSummary,
  createTransaction,
  createTransfer,
  updateTransaction,
  deleteTransaction,
  getTransferExportRows,
};
