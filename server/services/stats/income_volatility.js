const { Op, fn, col } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { assertDateStr, buildIncludedGroupWhere, quantiles } = require('./shared');

async function getIncomeVolatility({ userId, fromDate, toDate, topN = 5, groupId }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);

  const topRows = await models.Transaction.findAll({
    attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
    where: { userId, status: 'completed', date: { [Op.gte]: from, [Op.lte]: to } },
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'ingreso' },
      required: true,
      paranoid: false,
      include: [{ model: models.CategoryGroup, attributes: [], where: buildIncludedGroupWhere(groupId), required: true, paranoid: false }],
    }],
    group: [col('Category.name')],
    order: [[fn('SUM', col('Transaction.amount_usd')), 'DESC']],
    limit: Number(topN) || 5,
    raw: true,
  });
  const catNames = topRows.map(r => r.category);
  if (catNames.length === 0) return { categories_data: [] };

  const txs = await models.Transaction.findAll({
    attributes: [[col('Category.name'), 'category'], 'amountUsd'],
    where: { userId, status: 'completed', date: { [Op.gte]: from, [Op.lte]: to } },
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'ingreso', name: { [Op.in]: catNames } },
      required: true,
      paranoid: false,
      include: [{ model: models.CategoryGroup, attributes: [], where: buildIncludedGroupWhere(groupId), required: true, paranoid: false }],
    }],
    raw: true,
  });

  const byCat = new Map();
  for (const t of txs) {
    const k = t.category; const v = Number(t.amountUsd || 0);
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k).push(v);
  }
  const categories_data = [];
  for (const name of catNames) {
    const arr = (byCat.get(name) || []).filter((v)=>Number.isFinite(v)).sort((a,b)=>a-b);
    const n = arr.length; if (n === 0) { categories_data.push({ category: name, count: 0, q1: 0, median: 0, q3: 0, min: 0, max: 0, outliers: [] }); continue; }
    const { q1, median, q3 } = quantiles(arr); const iqr = q3 - q1; const lowFence = q1 - 1.5 * iqr; const highFence = q3 + 1.5 * iqr;
    const inliers = arr.filter(v => v >= lowFence && v <= highFence);
    const min = inliers.length ? inliers[0] : arr[0]; const max = inliers.length ? inliers[inliers.length - 1] : arr[arr.length - 1];
    const outliers = arr.filter(v => v < lowFence || v > highFence);
    categories_data.push({ category: name, count: n, q1, median, q3, min, max, outliers });
  }
  return { categories_data };
}

module.exports = { getIncomeVolatility };
