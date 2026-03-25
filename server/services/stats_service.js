const { Op, fn, col, literal } = require('sequelize');
const { models, sequelize } = require('../libs/sequelize');

function parseIdFilter(input) {
  if (!input) return null;
  const parts = Array.isArray(input) ? input : String(input).split(',');
  const ids = parts.map((s) => parseInt(String(s).trim(), 10)).filter((n) => Number.isInteger(n) && n > 0);
  return ids.length ? Array.from(new Set(ids)) : null;
}

function assertDateStr(s) {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(String(s))) throw new Error('Fecha inválida. Use YYYY-MM-DD');
  return s;
}

function formatPeriod(dt, unit) {
  const d = dt instanceof Date ? dt : new Date(dt);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  if (unit === 'month') return `${y}-${m}`;
  // week: use ISO week number approximation (Monday-based)
  const date = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // 0=Mon..6=Sun
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const week1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - week1) / 86400000 - 3) / 7);
  const wy = date.getUTCFullYear();
  return `${wy}-W${String(week).padStart(2, '0')}`;
}

async function getNetCashFlow({ userId, fromDate, toDate, timeUnit = 'month', accountId }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);
  const unit = timeUnit === 'week' ? 'week' : 'month';
  const accountIds = parseIdFilter(accountId);

  const whereTx = { userId, date: { [Op.gte]: from, [Op.lte]: to } };
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];

  // Aggregate in one pass with CASE
  const periodFn = fn('date_trunc', literal(`'${unit}'`), col('Transaction.date'));
  const rows = await models.Transaction.findAll({
    attributes: [
      [periodFn, 'period_dt'],
      [literal("SUM(CASE WHEN \"Category\".\"type\" = 'ingreso' THEN \"Transaction\".\"amount_usd\" ELSE 0 END)"), 'income_usd'],
      [literal("SUM(CASE WHEN \"Category\".\"type\" = 'gasto' THEN \"Transaction\".\"amount_usd\" ELSE 0 END)"), 'expense_usd'],
    ],
    where: whereTx,
    include: [{
      model: models.Category,
      attributes: [],
      required: true,
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
    }],
    group: [periodFn],
    order: [[periodFn, 'ASC']],
    raw: true,
  });

  let totalIncome = 0; let totalExpense = 0;
  const time_series = rows.map(r => {
    const income = Number(r.income_usd || 0);
    const expenses = Number(r.expense_usd || 0);
    const net = income - expenses;
    const savings_rate = income !== 0 ? net / income : 0;
    totalIncome += income; totalExpense += expenses;
    return {
      period: formatPeriod(r.period_dt, unit),
      income,
      expenses,
      net_flow: net,
      savings_rate,
    };
  });

  const net_cash_flow = totalIncome - totalExpense;
  const avg_savings_rate = totalIncome !== 0 ? net_cash_flow / totalIncome : 0;
  return {
    summary: {
      total_income: totalIncome,
      total_expenses: totalExpense,
      net_cash_flow,
      avg_savings_rate,
    },
    time_series,
  };
}

async function getSpendingHeatmap({ userId, fromDate, toDate, accountId }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);
  const accountIds = parseIdFilter(accountId);

  const whereTx = { userId, date: { [Op.gte]: from, [Op.lte]: to } };
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];

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
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
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
  const weekdays = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
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
    weekdays,
    data_points,
    summary: {
      peak_category: peakCategory || null,
      peak_day: peakDayIdx != null ? weekdays[peakDayIdx] : null,
    },
  };
}

function quantiles(sortedVals) {
  const n = sortedVals.length;
  if (n === 0) return { q1: 0, median: 0, q3: 0 };
  const pos = (p) => (p * (n - 1));
  const interp = (idx) => {
    const i = Math.floor(idx), f = idx - i;
    if (i + 1 < n) return sortedVals[i] * (1 - f) + sortedVals[i + 1] * f;
    return sortedVals[i];
  };
  return { q1: interp(pos(0.25)), median: interp(pos(0.5)), q3: interp(pos(0.75)) };
}

async function getExpenseVolatility({ userId, fromDate, toDate, topN = 5 }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);

  // Determine top categories by total first
  const topRows = await models.Transaction.findAll({
    attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
    where: { userId, date: { [Op.gte]: from, [Op.lte]: to } },
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'gasto' },
      required: true,
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
    }],
    group: [col('Category.name')],
    order: [[fn('SUM', col('Transaction.amount_usd')), 'DESC']],
    limit: Number(topN) || 5,
    raw: true,
  });
  const catNames = topRows.map(r => r.category);
  if (catNames.length === 0) return { categories_data: [] };

  // Fetch all amounts for these categories
  const txs = await models.Transaction.findAll({
    attributes: [[col('Category.name'), 'category'], 'amountUsd'],
    where: { userId, date: { [Op.gte]: from, [Op.lte]: to } },
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'gasto', name: { [Op.in]: catNames } },
      required: true,
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
    }],
    raw: true,
  });

  const byCat = new Map();
  for (const t of txs) {
    const k = t.category;
    const v = Number(t.amountUsd || 0);
    if (!byCat.has(k)) byCat.set(k, []);
    byCat.get(k).push(v);
  }
  const categories_data = [];
  for (const name of catNames) {
    const arr = (byCat.get(name) || []).filter((v)=>Number.isFinite(v)).sort((a,b)=>a-b);
    const n = arr.length;
    if (n === 0) { categories_data.push({ category: name, count: 0, q1: 0, median: 0, q3: 0, min: 0, max: 0, outliers: [] }); continue; }
    const { q1, median, q3 } = quantiles(arr);
    const iqr = q3 - q1;
    const lowFence = q1 - 1.5 * iqr;
    const highFence = q3 + 1.5 * iqr;
    const inliers = arr.filter(v => v >= lowFence && v <= highFence);
    const min = inliers.length ? inliers[0] : arr[0];
    const max = inliers.length ? inliers[inliers.length - 1] : arr[arr.length - 1];
    const outliers = arr.filter(v => v < lowFence || v > highFence);
    categories_data.push({ category: name, count: n, q1, median, q3, min, max, outliers });
  }

  return { categories_data };
}

function firstOfMonth(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }
function daysInMonth(d) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); }

async function getComparativeMoM({ userId, date }) {
  const base = date ? new Date(date) : new Date();
  const currentStart = firstOfMonth(base);
  const currentEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const prevEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 0)); // last day prev month
  const prevStart = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth(), 1));
  const currentDaysElapsed = base.getUTCDate();
  const prevDaysInPrev = daysInMonth(prevEnd);
  const prevMTDLastDay = Math.min(currentDaysElapsed, prevDaysInPrev);
  const prevEndMTD = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth(), prevMTDLastDay));

  const fmt = (d) => d.toISOString().slice(0, 10);
  const curWhere = { userId, date: { [Op.gte]: fmt(currentStart), [Op.lte]: fmt(currentEnd) } };
  const prevWhere = { userId, date: { [Op.gte]: fmt(prevStart), [Op.lte]: fmt(prevEndMTD) } };

  const [curCats, prevCats] = await Promise.all([
    models.Transaction.findAll({
      attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
      where: curWhere,
      include: [{
        model: models.Category,
        attributes: [],
        where: { type: 'gasto' },
        required: true,
        include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
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
        include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
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

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const cpName = `${monthNames[currentStart.getUTCMonth()]} MTD (1-${currentEnd.getUTCDate()})`;
  const ppName = `${monthNames[prevStart.getUTCMonth()]} MTD (1-${prevEndMTD.getUTCDate()})`;

  return {
    summary: {
      current_period_name: cpName,
      previous_period_name: ppName,
      current_total,
      previous_total,
      total_delta_usd,
      total_delta_percent,
    },
    categories_comparison,
  };
}

async function getMonthlyForecast({ userId, accountId, date, budgetTotal }) {
  const now = date ? new Date(date) : new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const days_in_month = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const days_elapsed = now.getUTCDate();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m, days_elapsed));
  const fmt = (d) => d.toISOString().slice(0, 10);

  const whereTx = { userId, date: { [Op.gte]: fmt(start), [Op.lte]: fmt(end) } };
  const accountIds = parseIdFilter(accountId);
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];

  const row = await models.Transaction.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('Transaction.amount_usd')), 0), 'sum_usd']],
    where: whereTx,
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'gasto' },
      required: true,
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
    }],
    raw: true,
  });
  const current_spending_mtd = Number(row?.sum_usd || 0);
  const avg_daily_spending = days_elapsed > 0 ? (current_spending_mtd / days_elapsed) : 0;
  const projected_total_spending = Math.round((avg_daily_spending * days_in_month) * 100) / 100;

  const budget_total = budgetTotal != null ? Number(budgetTotal) : null;
  const projected_over_under = budget_total != null ? (projected_total_spending - budget_total) : null;

  return {
    current_date: fmt(now),
    days_in_month,
    days_elapsed,
    current_spending_mtd,
    avg_daily_spending,
    projected_total_spending,
    budget_total,
    projected_over_under,
  };
}

async function getIncomeHeatmap({ userId, fromDate, toDate, accountId }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);
  const accountIds = parseIdFilter(accountId);

  const whereTx = { userId, date: { [Op.gte]: from, [Op.lte]: to } };
  if (accountIds) whereTx.accountId = accountIds.length > 1 ? { [Op.in]: accountIds } : accountIds[0];

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
      where: { type: 'ingreso' },
      required: true,
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
    }],
    group: [col('Category.name'), fn('date_part', 'dow', col('Transaction.date'))],
    order: [[col('Category.name'), 'ASC']],
    raw: true,
  });

  const catTotals = new Map();
  for (const r of rows) {
    const name = r.category; const amt = Number(r.sum_usd || 0);
    catTotals.set(name, (catTotals.get(name) || 0) + amt);
  }
  const categories = Array.from(catTotals.entries()).sort((a,b)=>b[1]-a[1]).map(([name])=>name);
  const catIndex = new Map(categories.map((c,i)=>[c,i]));
  const weekdays = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const data_points = rows.map(r => ({ category_idx: catIndex.get(r.category), day_idx: Number(r.dow), amount: Number(r.sum_usd || 0) }))
    .filter(dp => dp.category_idx !== undefined);

  let peakCategory = null; let peakDayIdx = null; let peakAmount = -1;
  const byCatDay = new Map();
  for (const dp of data_points) {
    const key = `${dp.category_idx}-${dp.day_idx}`;
    const val = (byCatDay.get(key) || 0) + dp.amount;
    byCatDay.set(key, val);
    if (val > peakAmount) { peakAmount = val; peakCategory = categories[dp.category_idx]; peakDayIdx = dp.day_idx; }
  }

  return { categories, weekdays, data_points, summary: { peak_category: peakCategory || null, peak_day: peakDayIdx != null ? weekdays[peakDayIdx] : null } };
}

async function getIncomeVolatility({ userId, fromDate, toDate, topN = 5 }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);

  const topRows = await models.Transaction.findAll({
    attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
    where: { userId, date: { [Op.gte]: from, [Op.lte]: to } },
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'ingreso' },
      required: true,
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
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
    where: { userId, date: { [Op.gte]: from, [Op.lte]: to } },
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'ingreso', name: { [Op.in]: catNames } },
      required: true,
      include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
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

async function getComparativeMoMIncome({ userId, date }) {
  const base = date ? new Date(date) : new Date();
  const currentStart = firstOfMonth(base);
  const currentEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const prevEnd = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 0));
  const prevStart = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth(), 1));
  const currentDaysElapsed = base.getUTCDate();
  const prevDaysInPrev = daysInMonth(prevEnd);
  const prevMTDLastDay = Math.min(currentDaysElapsed, prevDaysInPrev);
  const prevEndMTD = new Date(Date.UTC(prevEnd.getUTCFullYear(), prevEnd.getUTCMonth(), prevMTDLastDay));

  const fmt = (d) => d.toISOString().slice(0, 10);
  const curWhere = { userId, date: { [Op.gte]: fmt(currentStart), [Op.lte]: fmt(currentEnd) } };
  const prevWhere = { userId, date: { [Op.gte]: fmt(prevStart), [Op.lte]: fmt(prevEndMTD) } };

  const [curCats, prevCats] = await Promise.all([
    models.Transaction.findAll({
      attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
      where: curWhere,
      include: [{
        model: models.Category,
        attributes: [],
        where: { type: 'ingreso' },
        required: true,
        include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
      }],
      group: [col('Category.name')], raw: true,
    }),
    models.Transaction.findAll({
      attributes: [[col('Category.name'), 'category'], [fn('SUM', col('Transaction.amount_usd')), 'sum_usd']],
      where: prevWhere,
      include: [{
        model: models.Category,
        attributes: [],
        where: { type: 'ingreso' },
        required: true,
        include: [{ model: models.CategoryGroup, attributes: [], where: { analyticsBehavior: 'include' }, required: true }],
      }],
      group: [col('Category.name')], raw: true,
    })
  ]);

  const curMap = new Map(curCats.map(r => [r.category, Number(r.sum_usd || 0)]));
  const prevMap = new Map(prevCats.map(r => [r.category, Number(r.sum_usd || 0)]));
  const cats = Array.from(new Set([...curMap.keys(), ...prevMap.keys()]));
  const categories_comparison = cats.map(name => {
    const current_amount = curMap.get(name) || 0; const previous_amount = prevMap.get(name) || 0;
    let delta_percent = 0; if (previous_amount === 0) delta_percent = current_amount > 0 ? 1.0 : 0.0; else delta_percent = (current_amount - previous_amount) / previous_amount;
    return { category: name, current_amount, previous_amount, delta_percent };
  }).sort((a,b)=>Math.abs(b.delta_percent)-Math.abs(a.delta_percent));

  const current_total = Array.from(curMap.values()).reduce((a,b)=>a+b,0);
  const previous_total = Array.from(prevMap.values()).reduce((a,b)=>a+b,0);
  const total_delta_usd = current_total - previous_total;
  const total_delta_percent = previous_total === 0 ? (current_total>0?1.0:0.0) : total_delta_usd / previous_total;

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const cpName = `${monthNames[currentStart.getUTCMonth()]} MTD (1-${currentEnd.getUTCDate()})`;
  const ppName = `${monthNames[prevStart.getUTCMonth()]} MTD (1-${prevEndMTD.getUTCDate()})`;

  return { summary: { current_period_name: cpName, previous_period_name: ppName, current_total, previous_total, total_delta_usd, total_delta_percent }, categories_comparison };
}


module.exports = {
  getNetCashFlow,
  getSpendingHeatmap,
  getExpenseVolatility,
  getComparativeMoM,
  getMonthlyForecast,
  getIncomeHeatmap,
  getIncomeVolatility,
  getComparativeMoMIncome
};
