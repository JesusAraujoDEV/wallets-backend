const stats = require('../services/stats_service');
const { BadRequestError } = require('../utils/errors');

async function netCashFlow(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, time_unit = 'month', accountId } = req.query;
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getNetCashFlow({ userId, fromDate: from_date, toDate: to_date, timeUnit: time_unit, accountId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function spendingHeatmap(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, accountId } = req.query;
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getSpendingHeatmap({ userId, fromDate: from_date, toDate: to_date, accountId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function expenseVolatility(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, top_n_categories } = req.query;
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getExpenseVolatility({ userId, fromDate: from_date, toDate: to_date, topN: top_n_categories ? Number(top_n_categories) : 5 });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function comparativeMoM(req, res, next) {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const result = await stats.getComparativeMoM({ userId, date });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function monthlyForecast(req, res, next) {
  try {
    const userId = req.user.id;
    const { accountId, date, budget_total } = req.query;
    const result = await stats.getMonthlyForecast({ userId, accountId, date, budgetTotal: budget_total });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function incomeHeatmap(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, accountId } = req.query;
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getIncomeHeatmap({ userId, fromDate: from_date, toDate: to_date, accountId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function incomeVolatility(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, top_n_categories } = req.query;
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getIncomeVolatility({ userId, fromDate: from_date, toDate: to_date, topN: top_n_categories ? Number(top_n_categories) : 5 });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function comparativeMoMIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const result = await stats.getComparativeMoMIncome({ userId, date });
    return res.json(result);
  } catch (e) { return next(e); }
}

module.exports = { netCashFlow, spendingHeatmap, expenseVolatility, comparativeMoM, monthlyForecast, incomeHeatmap, incomeVolatility, comparativeMoMIncome };