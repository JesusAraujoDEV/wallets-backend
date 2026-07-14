const { Op, fn, col, literal } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { parseIdFilter, assertDateStr, formatPeriod, buildIncludedGroupWhere } = require('./shared');

async function getNetCashFlow({ userId, fromDate, toDate, timeUnit = 'month', accountId, groupId }) {
  const from = assertDateStr(fromDate);
  const to = assertDateStr(toDate);
  const unit = timeUnit === 'week' ? 'week' : 'month';
  const accountIds = parseIdFilter(accountId);

  const whereTx = { userId, status: 'completed', date: { [Op.gte]: from, [Op.lte]: to } };
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
      paranoid: false,
      include: [{ model: models.CategoryGroup, attributes: [], where: buildIncludedGroupWhere(groupId), required: true, paranoid: false }],
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

module.exports = { getNetCashFlow };
