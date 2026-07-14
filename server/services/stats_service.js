const { getNetCashFlow } = require('./stats/cash_flow');
const { getSpendingHeatmap } = require('./stats/spending_heatmap');
const { getExpenseVolatility } = require('./stats/expense_volatility');
const { getComparativeMoM } = require('./stats/comparative_mom');
const { getMonthlyForecast } = require('./stats/monthly_forecast');
const { getIncomeHeatmap } = require('./stats/income_heatmap');
const { getIncomeVolatility } = require('./stats/income_volatility');
const { getComparativeMoMIncome } = require('./stats/comparative_mom_income');

module.exports = {
  getNetCashFlow,
  getSpendingHeatmap,
  getExpenseVolatility,
  getComparativeMoM,
  getMonthlyForecast,
  getIncomeHeatmap,
  getIncomeVolatility,
  getComparativeMoMIncome,
};
