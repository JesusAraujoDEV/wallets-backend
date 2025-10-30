const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const txService = require('../services/transaction_service');

router.use(protect);

// GET /summary/balance
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats } = req.query;
    const result = await txService.getBalanceSummary({ userId, q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
    if (result.single) {
      return res.json({ ok: true, balance: result.balance_usd });
    }
    res.json({ ok: true, balance: {
      accounts_total_usd: result.accounts_total_usd,
      income_total_usd: result.income_total_usd,
      expense_total_usd: result.expense_total_usd,
      net_total_usd: result.net_total_usd,
    }});
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// GET /summary/income
router.get('/income', async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats } = req.query;
    const result = await txService.getTransactionsSummary({ userId, type: 'income', q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// GET /summary/expense
router.get('/expense', async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats } = req.query;
    const result = await txService.getTransactionsSummary({ userId, type: 'expense', q, categoryId, accountId, date, dateFrom, dateTo, month, includeInStats });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;
