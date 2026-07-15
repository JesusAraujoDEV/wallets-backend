'use strict';

const { Op } = require('sequelize');
const { models } = require('../libs/sequelize');
const { BadRequestError } = require('../utils/errors');
const { resolveDateUtc, fetchRateFromProvider, getRateWithFallback } = require('./exchange_rate_provider');

async function getUsdRateByDate(dateInput) {
  const rate = await getRateWithFallback(dateInput);
  if (!rate) {
    throw new BadRequestError(
      'No se pudo obtener la tasa BCV para la fecha indicada. Envia exchangeRate manual para continuar.'
    );
  }
  return rate.usdRate;
}

async function getRateForDate(dateInput) {
  const target = resolveDateUtc(dateInput);
  const rate = await getRateWithFallback(target);
  if (!rate) {
    throw new BadRequestError('No se pudo obtener la tasa BCV para la fecha indicada.');
  }
  const source = rate.date === target ? 'live' : 'fallback';
  return { ...rate, source };
}

async function getCurrentRate() {
  return getRateForDate(resolveDateUtc());
}

async function getRateHistory({ from, to }) {
  const where = {};
  if (from || to) {
    where.date = {};
    if (from) where.date[Op.gte] = from;
    if (to) where.date[Op.lte] = to;
  }

  const rows = await models.ExchangeRate.findAll({
    where,
    order: [['date', 'ASC']],
    raw: true,
  });

  return rows.map((r) => ({
    date: r.date,
    usdRate: Number(r.usdRate),
    eurRate: Number(r.eurRate),
    usdtRate: r.usdtRate === null ? null : Number(r.usdtRate),
  }));
}

async function upsertTodayRate() {
  const today = resolveDateUtc();
  const rate = await fetchRateFromProvider(today);
  if (!rate || rate.eurRate === null) return null;

  const [row] = await models.ExchangeRate.upsert({
    date: rate.date,
    usdRate: rate.usdRate,
    eurRate: rate.eurRate,
    usdtRate: rate.usdtRate,
  });
  return row;
}

module.exports = {
  getUsdRateByDate,
  getCurrentRate,
  getRateForDate,
  getRateHistory,
  upsertTodayRate,
  resolveDateUtc,
};
