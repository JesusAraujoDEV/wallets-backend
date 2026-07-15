const exchangeRateService = require('../services/exchange_rate_service');
const { BadRequestError } = require('../utils/errors');

async function current(req, res, next) {
  try {
    const rate = await exchangeRateService.getCurrentRate();
    return res.json({ ok: true, rate });
  } catch (e) {
    return next(e);
  }
}

async function byDate(req, res, next) {
  try {
    const { date } = req.query || {};
    if (!date) throw new BadRequestError('date es requerido.');
    const rate = await exchangeRateService.getRateForDate(date);
    return res.json({ ok: true, rate });
  } catch (e) {
    return next(e);
  }
}

async function history(req, res, next) {
  try {
    const { from, to } = req.query || {};
    const rates = await exchangeRateService.getRateHistory({ from, to });
    return res.json({ ok: true, rates });
  } catch (e) {
    return next(e);
  }
}

module.exports = { current, byDate, history };
