const txService = require('../services/transaction_service');

async function balance(req, res, next) {
  try {
    const userId = req.user.id;
    const { q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats } = req.query;
    const result = await txService.getBalanceSummary({ userId, q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
    if (result.single) {
      return res.json({ ok: true, balance: result.balance_usd });
    }
    return res.json({ ok: true, balance: {
      accounts_total_usd: result.accounts_total_usd,
      income_total_usd: result.income_total_usd,
      expense_total_usd: result.expense_total_usd,
      net_total_usd: result.net_total_usd,
    }});
  } catch (e) { return next(e); }
}

async function income(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_month, to_month, includeInStats, q, categoryId, accountId, date, dateFrom, dateTo, month } = req.query;
    if (from_month) {
      const result = await txService.getMonthlySummary({ userId, type: 'income', fromMonth: from_month, toMonth: to_month, includeInStats, categoryId, accountId });
      return res.json({ ok: true, ...result });
    }
    const totalRes = await txService.getTransactionsSummary({ userId, type: 'income', q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
    return res.json({ ok: true, income_total: totalRes.income_total });
  } catch (e) { return next(e); }
}

async function expense(req, res, next) {
  try {
    const userId = req.user.id;
    const { from_month, to_month, includeInStats, q, categoryId, accountId, date, dateFrom, dateTo, month } = req.query;
    if (from_month) {
      const result = await txService.getMonthlySummary({ userId, type: 'expense', fromMonth: from_month, toMonth: to_month, includeInStats, categoryId, accountId });
      return res.json({ ok: true, ...result });
    }
    const totalRes = await txService.getTransactionsSummary({ userId, type: 'expense', q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
    return res.json({ ok: true, expense_total: totalRes.expense_total });
  } catch (e) { return next(e); }
}

module.exports = { balance, income, expense };