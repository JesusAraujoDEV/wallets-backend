const { Op, fn, col } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { buildIncludedGroupWhere, firstOfMonth, daysInMonth } = require('./shared');

async function getComparativeMoM({ userId, date, groupId, currentFrom, currentTo, previousFrom, previousTo }) {
  const fmt = (d) => d.toISOString().slice(0, 10);
  let currentStart, currentEnd, prevStart, prevEndMTD;

  if (currentFrom && currentTo && previousFrom && previousTo) {
    currentStart = new Date(currentFrom);
    currentEnd = new Date(currentTo);
    prevStart = new Date(previousFrom);
    prevEndMTD = new Date(previousTo);
  } else {
    const base = date ? new Date(date) : new Date();
    currentStart = firstOfMonth(base);
    currentEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
    const prevEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 0)); // last day prev month
    prevStart = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth(), 1));
    const currentDaysElapsed = base.getUTCDate();
    const prevDaysInPrev = daysInMonth(prevEnd);
    const prevMTDLastDay = Math.min(currentDaysElapsed, prevDaysInPrev);
    prevEndMTD = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth(), prevMTDLastDay));
  }

  const curWhere = { userId, status: 'completed', date: { [Op.gte]: fmt(currentStart), [Op.lte]: fmt(currentEnd) } };
  const prevWhere = { userId, status: 'completed', date: { [Op.gte]: fmt(prevStart), [Op.lte]: fmt(prevEndMTD) } };

  const [curCats, prevCats] = await Promise.all([
    models.Transaction.findAll({
      attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
      where: curWhere,
      include: [{
        model: models.Category,
        attributes: [],
        where: { type: 'gasto' },
        required: true,
        paranoid: false,
        include: [{ model: models.CategoryGroup, attributes: [], where: buildIncludedGroupWhere(groupId), required: true, paranoid: false }],
      }],
      group: [col('Category.name')], raw: true,
    }),
    models.Transaction.findAll({
      attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
      where: prevWhere,
      include: [{
        model: models.Category,
        attributes: [],
        where: { type: 'gasto' },
        required: true,
        paranoid: false,
        include: [{ model: models.CategoryGroup, attributes: [], where: buildIncludedGroupWhere(groupId), required: true, paranoid: false }],
      }],
      group: [col('Category.name')], raw: true,
    })
  ]);

  const curMap = new Map(curCats.map(r => [r.category, Number(r.sum_usd || 0)]));
  const prevMap = new Map(prevCats.map(r => [r.category, Number(r.sum_usd || 0)]));
  const cats = Array.from(new Set([...curMap.keys(), ...prevMap.keys()]));
  const categories_comparison = cats.map(name => {
    const current_amount = curMap.get(name) || 0;
    const previous_amount = prevMap.get(name) || 0;
    let delta_percent = 0;
    if (previous_amount === 0) delta_percent = current_amount > 0 ? 1.0 : 0.0;
    else delta_percent = (current_amount - previous_amount) / previous_amount;
    return { category: name, current_amount, previous_amount, delta_percent };
  }).sort((a,b)=>Math.abs(b.delta_percent)-Math.abs(a.delta_percent));

  const current_total = Array.from(curMap.values()).reduce((a,b)=>a+b,0);
  const previous_total = Array.from(prevMap.values()).reduce((a,b)=>a+b,0);
  const total_delta_usd = current_total - previous_total;
  const total_delta_percent = previous_total === 0 ? (current_total>0?1.0:0.0) : total_delta_usd / previous_total;

  return {
    summary: {
      current_period_start: fmt(currentStart),
      current_period_end: fmt(currentEnd),
      previous_period_start: fmt(prevStart),
      previous_period_end: fmt(prevEndMTD),
      current_total,
      previous_total,
      total_delta_usd,
      total_delta_percent,
    },
    categories_comparison,
  };
}

module.exports = { getComparativeMoM };
