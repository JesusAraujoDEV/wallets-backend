const cron = require('node-cron');
const { syncRecentRates } = require('./exchange_rate_service');

let exchangeRateWorkerTask = null;

function startExchangeRateWorkerCron() {
  if (exchangeRateWorkerTask) return exchangeRateWorkerTask;

  // Runs a few times a day (not just once at 00:15) so a same-day BCV rate published
  // later gets picked up without waiting until tomorrow's run.
  exchangeRateWorkerTask = cron.schedule('15 0,8,14,20 * * *', async () => {
    try {
      const rows = await syncRecentRates();
      console.log(`[ExchangeRateWorker] Sync complete: ${rows.length} rate(s) upserted`, rows.map((r) => r.get({ plain: true }).date));
    } catch (error) {
      console.error('[ExchangeRateWorker] Sync failed:', error.message);
    }
  });

  return exchangeRateWorkerTask;
}

module.exports = { startExchangeRateWorkerCron };
