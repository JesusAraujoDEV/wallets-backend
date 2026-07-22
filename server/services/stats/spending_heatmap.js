const { Op, fn, col } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { parseIdFilter, assertDateStr, parseSinglePositiveId, WEEKDAYS } = require('./shared');
const { resolveAnalyticsCategoryFilter, applyAnalyticsCategoryFilter } = require('../transactions/analytics_group_filter');

async function getSpendingHeatmap({ userId, fromDate, toDate, accountId, groupId }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);
  const accountIds = parseIdFilter(accountId);

  const whereTx = { userId, status: 'completed', date: { [Op.gte]: from, [Op.lte]: to } };
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];
  // ponytail: behavior hardcoded 'include' — this endpoint has no include/exclude toggle
  const analyticsFilter = await resolveAnalyticsCategoryFilter({ userId, behavior: 'include', groupId: parseSinglePositiveId(groupId) });
  applyAnalyticsCategoryFilter(whereTx, analyticsFilter);

  const rows = await models.Transaction.findAll({
    attributes: [
      [col('Category.name'), 'category'],
      [fn('date_part', 'dow', col('Transaction.date')), 'dow'],
      [fn('SUM', col('Transaction.amount_usd')), 'sum_usd'],
    ],
    where: whereTx,
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'gasto' },
      required: true,
      paranoid: false,
    }],
    group: [col('Category.name'), fn('date_part', 'dow', col('Transaction.date'))],
    order: [[col('Category.name'), 'ASC']],
    raw: true,
  });

  // Build categories list and totals to rank
  const catTotals = new Map();
  for (const r of rows) {
    const name = r.category;
    const amt = Number(r.sum_usd || 0);
    catTotals.set(name, (catTotals.get(name) || 0) + amt);
  }
  const categories = Array.from(catTotals.entries()).sort((a,b)=>b[1]-a[1]).map(([name])=>name);
  const catIndex = new Map(categories.map((c,i)=>[c,i]));
  const data_points = rows.map(r => ({
    category_idx: catIndex.get(r.category),
    day_idx: Number(r.dow),
    amount: Number(r.sum_usd || 0),
  })).filter(dp => dp.category_idx !== undefined);

  // Summary: peak category and day
  let peakCategory = null; let peakDayIdx = null; let peakAmount = -1;
  const byCatDay = new Map();
  for (const dp of data_points) {
    const key = `${dp.category_idx}-${dp.day_idx}`;
    const val = (byCatDay.get(key) || 0) + dp.amount;
    byCatDay.set(key, val);
    if (val > peakAmount) { peakAmount = val; peakCategory = categories[dp.category_idx]; peakDayIdx = dp.day_idx; }
  }

  return {
    categories,
    weekdays: WEEKDAYS,
    data_points,
    summary: {
      peak_category: peakCategory || null,
      peak_day: peakDayIdx != null ? WEEKDAYS[peakDayIdx] : null,
    },
  };
}

module.exports = { getSpendingHeatmap };
