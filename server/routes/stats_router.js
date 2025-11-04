const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const statsCtrl = require('../controllers/stats_controller');

router.use(protect);

// 1) Net Cash Flow and Savings Rate
router.get('/net-cash-flow', statsCtrl.netCashFlow);

// 2) Spending Heatmap
router.get('/spending-heatmap', statsCtrl.spendingHeatmap);

// 3) Expense Volatility (Boxplot stats)
router.get('/expense-volatility', statsCtrl.expenseVolatility);

// 4) Comparative MoM
router.get('/comparative-mom', statsCtrl.comparativeMoM);

// 5) Monthly Forecast
router.get('/monthly-forecast', statsCtrl.monthlyForecast);

module.exports = router;
