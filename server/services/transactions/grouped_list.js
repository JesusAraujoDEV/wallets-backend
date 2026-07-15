const { Op, fn, col, literal, where: sqWhere } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { parseIdFilter, parseDebtIdFilter, monthToRange, parseAnalyticsBehavior } = require('./shared');

function buildGroupedWhere({ userId, accountId, categoryId, debtId, date, dateFrom, dateTo, month, cursorDate }) {
  const whereTx = { userId };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  const parsedDebtId = parseDebtIdFilter(debtId);
  if (parsedDebtId !== undefined) whereTx.debtId = parsedDebtId;

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
  return whereTx;
}

function buildCategoryInclude({ catWhere, behavior, attributes }) {
  return [{
    model: models.Category,
    attributes,
    where: Object.keys(catWhere).length ? catWhere : undefined,
    required: Object.keys(catWhere).length > 0 || behavior !== null,
    paranoid: false,
    include: [{
      model: models.CategoryGroup,
      attributes: [],
      where: behavior ? { analyticsBehavior: behavior } : undefined,
      required: behavior !== null,
      paranoid: false,
    }],
  }];
}

async function getGroupedTransactions(filters) {
  const { userId, pageSize = 20, cursorDate, q, type, categoryId, accountId, debtId, date, dateFrom, dateTo, month, analyticsBehavior } = filters;
  const whereTx = buildGroupedWhere({ userId, accountId, categoryId, debtId, date, dateFrom, dateTo, month, cursorDate });

  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  const behavior = parseAnalyticsBehavior(analyticsBehavior);
  if (q) {
    whereTx[Op.or] = [
      { description: { [Op.iLike]: `%${q}%` } },
      sqWhere(col('Category.name'), { [Op.iLike]: `%${q}%` })
    ];
  }
  const include = buildCategoryInclude({ catWhere, behavior, attributes: ['type', 'name'] });
  const includeDay = buildCategoryInclude({ catWhere, behavior, attributes: [] });

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
    attributes: ['id', 'description', 'amount', 'currency', ['amount_usd', 'amountUsd'], ['exchange_rate_used', 'exchangeRateUsed'], ['amount_usdt', 'amountUsdt'], 'date', 'status', ['category_id', 'categoryId'], ['account_id', 'accountId'], ['debt_id', 'debtId']],
    where: { ...whereTx, ...(days.length ? { date: { [Op.in]: days } } : {}) },
    include: buildCategoryInclude({ catWhere, behavior, attributes: ['type'] }),
    order: [['date', 'DESC'], ['id', 'DESC']],
    raw: true,
    nest: true,
  });

  let nextCursorDate = null;
  if (items.length > 0) {
    const lastDate = items[items.length - 1].date;
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
    amountUsdt: it.amountUsdt,
    date: it.date,
    status: it.status,
    categoryId: it.categoryId,
    accountId: it.accountId,
    debtId: it.debtId || null,
    type: it.Category?.type,
  }));

  return { items: shaped, hasMore: nextCursorDate !== null, nextCursorDate };
}

module.exports = { getGroupedTransactions };
