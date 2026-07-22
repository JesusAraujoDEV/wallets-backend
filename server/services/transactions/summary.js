const { Op, fn, col } = require('sequelize');
const { models } = require('../../libs/sequelize');
const {
  parseAnalyticsBehavior, parseSinglePositiveId,
  buildTxFilterWhere, parseIdFilter,
} = require('./shared');
const { resolveAnalyticsCategoryFilter, applyAnalyticsCategoryFilter } = require('./analytics_group_filter');
const { getAllTransactions } = require('./list');
const { getVesPerUsdByDate } = require('./exchange');

async function getTransactionsSummary({ userId, type, q, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior, groupId }) {
  const whereTx = buildTxFilterWhere({ userId, q, categoryId, accountId, date, dateFrom, dateTo, month });
  whereTx.status = 'completed';
  const catWhere = {};
  if (type) catWhere.type = type === 'income' ? 'ingreso' : 'gasto';
  const behavior = parseAnalyticsBehavior(analyticsBehavior);
  const parsedGroupId = parseSinglePositiveId(groupId);
  const analyticsFilter = await resolveAnalyticsCategoryFilter({ userId, behavior, groupId: parsedGroupId });
  applyAnalyticsCategoryFilter(whereTx, analyticsFilter);

  const sumRow = await models.Transaction.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('Transaction.amount_usd')), 0), 'totalUsd']],
    where: whereTx,
    include: [{
      model: models.Category,
      attributes: [],
      where: Object.keys(catWhere).length ? catWhere : undefined,
      required: Object.keys(catWhere).length > 0,
      paranoid: false,
    }],
    raw: true,
  });
  const total = Number(sumRow?.totalUsd || 0);

  // Reuse existing list function ensuring the type filter is applied
  const items = await getAllTransactions({ userId, q, type, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior, groupId });

  if (type === 'income') {
    return { income_total: total, transactions_income: items };
  } else {
    return { expense_total: total, transactions_expense: items };
  }
}

async function getBalanceSummary({ userId, q, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior, groupId }) {
  const ids = parseIdFilter(accountId);
  const whereAcc = { userId };
  if (ids && ids.length > 0) whereAcc.id = ids.length > 1 ? { [Op.in]: ids } : ids[0];

  // Fetch accounts (filtered if ids present)
  const accounts = await models.Account.findAll({ where: whereAcc, raw: true });
  const rate = await getVesPerUsdByDate();

  // If a single account id is provided, return only that account's USD balance in a simplified shape
  if (ids && ids.length === 1) {
    const acc = accounts.find(a => Number(a.id) === Number(ids[0]));
    if (!acc) {
      return { single: true, balance_usd: 0 };
    }
    const bal = Number(acc.balance || 0);
    const balance_usd = acc.currency === 'VES' ? bal / Number(rate) : bal;
    return { single: true, balance_usd };
  }

  // Otherwise sum account balances converted to USD
  let accounts_total_usd = 0;
  for (const acc of accounts) {
    const bal = Number(acc.balance || 0);
    if (acc.currency === 'VES') accounts_total_usd += bal / Number(rate);
    else accounts_total_usd += bal; // treat USD/USDT equivalent
  }

  // Income and expense totals in USD over the requested range
  const income = await getTransactionsSummary({ userId, type: 'income', q, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior, groupId });
  const expense = await getTransactionsSummary({ userId, type: 'expense', q, categoryId, accountId, date, dateFrom, dateTo, month, analyticsBehavior, groupId });
  const income_total_usd = Number(income.income_total || 0);
  const expense_total_usd = Number(expense.expense_total || 0);
  const net_total_usd = income_total_usd - expense_total_usd;

  return {
    single: false,
    accounts_total_usd,
    income_total_usd,
    expense_total_usd,
    net_total_usd,
  };
}

module.exports = { getTransactionsSummary, getBalanceSummary };
