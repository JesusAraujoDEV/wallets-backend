const { getRateWithFallback } = require('../exchange_rate_provider');

const FALLBACK_RATE = 150;

async function getVesPerUsdByDate(date) {
  const rate = await getRateWithFallback(date);
  return rate ? rate.usdRate : FALLBACK_RATE;
}

module.exports = { getVesPerUsdByDate };
