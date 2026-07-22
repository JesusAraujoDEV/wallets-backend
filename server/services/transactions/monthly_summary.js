const { Op, fn, col } = require('sequelize');
const { models } = require('../../libs/sequelize');
const {
  parseAnalyticsBehavior, parseSinglePositiveId,
  parseIdFilter, monthRangeInclusive, monthsBetweenList,
} = require('./shared');
const { resolveAnalyticsCategoryFilter, applyAnalyticsCategoryFilter } = require('./analytics_group_filter');

async function getMonthlySummary({ userId, type, fromMonth, toMonth, analyticsBehavior, categoryId, accountId, groupId }) {
  const range = monthRangeInclusive(fromMonth, toMonth);
  if (!range) throw new Error('Parámetros from_month/to_month inválidos. Formato esperado YYYY-MM y from <= to.');

  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  const behavior = parseAnalyticsBehavior(analyticsBehavior);
  const parsedGroupId = parseSinglePositiveId(groupId);

  // Build tx where with optional filters
  const whereTx = { userId, status: 'completed', date: { [Op.gte]: range.from, [Op.lte]: range.to } };
  const accountIds = parseIdFilter(accountId);
  const categoryIds = parseIdFilter(categoryId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  if (categoryIds) whereTx.categoryId = categoryIds.length > 1 ? { [Op.in]: categoryIds } : categoryIds[0];
  const analyticsFilter = await resolveAnalyticsCategoryFilter({ userId, behavior, groupId: parsedGroupId });
  applyAnalyticsCategoryFilter(whereTx, analyticsFilter);

  const rows = await models.Transaction.findAll({
    attributes: [
      [fn('date_trunc', 'month', col('Transaction.date')), 'month_dt'],
      [fn('COALESCE', fn('SUM', col('Transaction.amount_usd')), 0), 'sum_usd'],
    ],
    where: whereTx,
    include: [{
      model: models.Category,
      attributes: [],
      where: Object.keys(catWhere).length ? catWhere : undefined,
      required: true,
      paranoid: false,
    }],
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

module.exports = { getMonthlySummary };
