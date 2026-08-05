const { Op, col, where: sqWhere } = require('sequelize');
const { models } = require('../../libs/sequelize');
const {
  parseIdFilter, parseDebtIdFilter, monthToRange,
  parseAnalyticsBehavior, parseSinglePositiveId,
} = require('./shared');
const { resolveAnalyticsCategoryFilter, applyAnalyticsCategoryFilter } = require('./analytics_group_filter');

async function getAllTransactions(filters) {
  const { userId, q, type, categoryId, accountId, debtId, date, dateFrom, dateTo, month, analyticsBehavior, groupId, status, tagId } = filters;
  const whereTx = { userId };
  if (status) whereTx.status = status;
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  const parsedDebtId = parseDebtIdFilter(debtId);
  if (parsedDebtId !== undefined) whereTx.debtId = parsedDebtId;
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
  const behavior = parseAnalyticsBehavior(analyticsBehavior);
  const parsedGroupId = parseSinglePositiveId(groupId);
  const analyticsFilter = await resolveAnalyticsCategoryFilter({ userId, behavior, groupId: parsedGroupId });
  applyAnalyticsCategoryFilter(whereTx, analyticsFilter);
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
    paranoid: false,
  });

  // Filter by tagId if provided
  if (tagId) {
    const tagLinks = await models.TransactionTag.findAll({
      where: { tagId: parseInt(tagId) },
      attributes: ['transactionId'],
      raw: true,
    });
    const txIdsForTag = tagLinks.map(l => l.transactionId);
    if (txIdsForTag.length === 0) return [];
    whereTx.id = { [Op.in]: txIdsForTag };
  }

  const rows = await models.Transaction.findAll({
    attributes: ['id', 'description', 'amount', 'currency', ['amount_usd', 'amountUsd'], ['exchange_rate_used', 'exchangeRateUsed'], ['amount_usdt', 'amountUsdt'], 'date', 'status', ['category_id', 'categoryId'], ['account_id', 'accountId'], ['debt_id', 'debtId']],
    where: whereTx,
    include,
    order: [['date', 'DESC'], ['id', 'DESC']],
    raw: true,
    nest: true,
  });

  // Batch-fetch tags for all returned transactions
  const txIds = rows.map(r => r.id);
  let tagsMap = {};
  if (txIds.length > 0) {
    const links = await models.TransactionTag.findAll({
      where: { transactionId: { [Op.in]: txIds } },
      raw: true,
    });
    if (links.length > 0) {
      const tagIds = [...new Set(links.map(l => l.tagId))];
      const allTags = await models.Tag.findAll({
        where: { id: { [Op.in]: tagIds } },
        attributes: ['id', 'name', 'color', 'icon'],
        raw: true,
      });
      const tagById = Object.fromEntries(allTags.map(t => [t.id, t]));
      for (const link of links) {
        if (!tagsMap[link.transactionId]) tagsMap[link.transactionId] = [];
        if (tagById[link.tagId]) tagsMap[link.transactionId].push(tagById[link.tagId]);
      }
    }
  }

  return rows.map(r => ({
    id: r.id,
    description: r.description,
    amount: r.amount,
    currency: r.currency,
    amountUsd: r.amountUsd,
    exchangeRateUsed: r.exchangeRateUsed,
    amountUsdt: r.amountUsdt,
    date: r.date,
    status: r.status,
    categoryId: r.categoryId,
    accountId: r.accountId,
    debtId: r.debtId || null,
    type: r.Category?.type,
    tags: tagsMap[r.id] || [],
  }));
}

module.exports = { getAllTransactions };
