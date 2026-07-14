const { Op, fn, col } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { parseIdFilter, buildIncludedGroupWhere } = require('./shared');

async function getMonthlyForecast({ userId, accountId, date, budgetTotal, groupId }) {
  const now = date ? new Date(date) : new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const days_in_month = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const days_elapsed = now.getUTCDate();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(y, m, days_elapsed));
  const fmt = (d) => d.toISOString().slice(0, 10);

  const whereTx = { userId, status: 'completed', date: { [Op.gte]: fmt(start), [Op.lte]: fmt(end) } };
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
      paranoid: false,
      include: [{ model: models.CategoryGroup, attributes: [], where: buildIncludedGroupWhere(groupId), required: true, paranoid: false }],
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

module.exports = { getMonthlyForecast };
