const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const stats = require('../services/stats_service');

router.use(protect);

// 1) Net Cash Flow and Savings Rate
router.get('/net-cash-flow', async (req, res) => {
  try {
    const userId = req.user.id;
    const { from_date, to_date, time_unit = 'month', accountId } = req.query;
    if (!from_date || !to_date) return res.status(400).json({ ok: false, message: 'from_date y to_date son requeridos (YYYY-MM-DD)' });
    const result = await stats.getNetCashFlow({ userId, fromDate: from_date, toDate: to_date, timeUnit: time_unit, accountId });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 2) Spending Heatmap
router.get('/spending-heatmap', async (req, res) => {
  try {
    const userId = req.user.id;
    const { from_date, to_date, accountId } = req.query;
    if (!from_date || !to_date) return res.status(400).json({ ok: false, message: 'from_date y to_date son requeridos (YYYY-MM-DD)' });
    const result = await stats.getSpendingHeatmap({ userId, fromDate: from_date, toDate: to_date, accountId });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 3) Expense Volatility (Boxplot stats)
router.get('/expense-volatility', async (req, res) => {
  try {
    const userId = req.user.id;
    const { from_date, to_date, top_n_categories } = req.query;
    if (!from_date || !to_date) return res.status(400).json({ ok: false, message: 'from_date y to_date son requeridos (YYYY-MM-DD)' });
    const result = await stats.getExpenseVolatility({ userId, fromDate: from_date, toDate: to_date, topN: top_n_categories ? Number(top_n_categories) : 5 });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 4) Comparative MoM
router.get('/comparative-mom', async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const result = await stats.getComparativeMoM({ userId, date });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// 5) Monthly Forecast
router.get('/monthly-forecast', async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId, date, budget_total } = req.query;
    const result = await stats.getMonthlyForecast({ userId, accountId, date, budgetTotal: budget_total });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

module.exports = router;
