const stats = require('../services/stats_service');
const { BadRequestError } = require('../utils/errors');

function parseOptionalGroupId(value) {
  if (typeof value === 'undefined' || value === null || value === '') return undefined;
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError('groupId must be a positive integer');
  }
  return parsed;
}

async function netCashFlow(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, time_unit = 'month', accountId } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getNetCashFlow({ userId, fromDate: from_date, toDate: to_date, timeUnit: time_unit, accountId, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function spendingHeatmap(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, accountId } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getSpendingHeatmap({ userId, fromDate: from_date, toDate: to_date, accountId, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function expenseVolatility(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, top_n_categories } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getExpenseVolatility({ userId, fromDate: from_date, toDate: to_date, topN: top_n_categories ? Number(top_n_categories) : 5, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function comparativeMoM(req, res, next) {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    const result = await stats.getComparativeMoM({ userId, date, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function monthlyForecast(req, res, next) {
  try {
    const userId = req.user.id;
    const { accountId, date, budget_total } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    const result = await stats.getMonthlyForecast({ userId, accountId, date, budgetTotal: budget_total, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function incomeHeatmap(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, accountId } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getIncomeHeatmap({ userId, fromDate: from_date, toDate: to_date, accountId, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function incomeVolatility(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_date, to_date, top_n_categories } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    if (!from_date || !to_date) throw new BadRequestError('from_date y to_date son requeridos (YYYY-MM-DD)');
    const result = await stats.getIncomeVolatility({ userId, fromDate: from_date, toDate: to_date, topN: top_n_categories ? Number(top_n_categories) : 5, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

async function comparativeMoMIncome(req, res, next) {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const groupId = parseOptionalGroupId(req.query.groupId);
    const result = await stats.getComparativeMoMIncome({ userId, date, groupId });
    return res.json(result);
  } catch (e) { return next(e); }
}

module.exports = { netCashFlow, spendingHeatmap, expenseVolatility, comparativeMoM, monthlyForecast, incomeHeatmap, incomeVolatility, comparativeMoMIncome };