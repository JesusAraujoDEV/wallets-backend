const cron = require('node-cron');
const { upsertTodayRate } = require('./exchange_rate_service');

let exchangeRateWorkerTask = null;

function startExchangeRateWorkerCron() {
  if (exchangeRateWorkerTask) return exchangeRateWorkerTask;

  exchangeRateWorkerTask = cron.schedule('15 0 * * *', async () => {
    try {
      const row = await upsertTodayRate();
      console.log('[ExchangeRateWorker] Daily run complete:', row ? row.get({ plain: true }) : 'no rate available');
    } catch (error) {
      console.error('[ExchangeRateWorker] Daily run failed:', error.message);
    }
  });

  return exchangeRateWorkerTask;
}

module.exports = { startExchangeRateWorkerCron };
