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

  const mapped = rows.map((r) => ({
    date: r.date,
    usdRate: Number(r.usdRate),
    eurRate: Number(r.eurRate),
    usdtRate: r.usdtRate === null ? null : Number(r.usdtRate),
  }));

  // BCV can publish today's rate after the last sync-worker run (see syncRecentRates):
  // patch it in from the live/cached source so the table doesn't lag behind /current.
  const today = resolveDateUtc();
  const requestedRange = (!to || to >= today) && (!from || from <= today);
  const alreadyHasToday = mapped.some((r) => r.date === today);
  if (requestedRange && !alreadyHasToday) {
    const todayRate = await getRateForDate(today).catch(() => null);
    if (todayRate && todayRate.source === 'live') {
      mapped.push({ date: today, usdRate: Number(todayRate.usdRate), eurRate: Number(todayRate.eurRate), usdtRate: todayRate.usdtRate == null ? null : Number(todayRate.usdtRate) });
    }
  }

  return mapped;
}

async function upsertRateForDate(date) {
  const rate = await fetchRateFromProvider(date);
  if (!rate || rate.eurRate === null) return null;

  const [row] = await models.ExchangeRate.upsert({
    date: rate.date,
    usdRate: rate.usdRate,
    eurRate: rate.eurRate,
    usdtRate: rate.usdtRate,
  });
  return row;
}

async function upsertTodayRate() {
  return upsertRateForDate(resolveDateUtc());
}

// BCV sometimes publishes a day's rate late, or the worker misses a run (downtime, restart).
// Re-checking the last few days closes that gap automatically on the next run, instead of
// leaving a permanent hole that only a manual backfill would fix.
async function syncRecentRates(daysBack = 5) {
  const today = resolveDateUtc();
  const existing = await models.ExchangeRate.findAll({
    where: { date: { [Op.gte]: shiftDateUtc(today, -daysBack) } },
    attributes: ['date'],
    raw: true,
  });
  const existingDates = new Set(existing.map((r) => r.date));

  const results = [];
  for (let i = 0; i <= daysBack; i++) {
    const date = shiftDateUtc(today, -i);
    if (existingDates.has(date)) continue;
    const row = await upsertRateForDate(date);
    if (row) results.push(row);
  }
  return results;
}

function shiftDateUtc(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

module.exports = {
  getUsdRateByDate,
  getCurrentRate,
  getRateForDate,
  getRateHistory,
  upsertTodayRate,
  syncRecentRates,
  resolveDateUtc,
};
