'use strict';

const axios = require('axios');

const BCV_API_BASE_URL = (process.env.BCV_API_BASE_URL || 'https://bcv-api.irissoftware.lat').replace(/\/$/, '');
const BCV_API_TIMEOUT_MS = Number(process.env.BCV_API_TIMEOUT_MS || 5000);
const CACHE_TTL_MS = Number(process.env.BCV_RATE_CACHE_TTL_MS || 10 * 60 * 1000);
const FALLBACK_MAX_DAYS_BACK = 7;

const rateCache = new Map(); // date -> { value: {date, usdRate, eurRate, usdtRate}, expiresAt }

function resolveDateUtc(dateInput) {
  if (dateInput && typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateStr, deltaDays) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function getCached(date) {
  const cached = rateCache.get(date);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    rateCache.delete(date);
    return null;
  }
  return cached.value;
}

function setCached(date, value) {
  rateCache.set(date, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchRateFromProvider(date) {
  const url = `${BCV_API_BASE_URL}/api/v1/exchange-rates?date=${date}`;
  try {
    const response = await axios.get(url, {
      timeout: BCV_API_TIMEOUT_MS,
      headers: { accept: 'application/json' },
    });

    const usdRate = Number(response?.data?.usd_rate);
    const eurRate = Number(response?.data?.eur_rate);
    if (!Number.isFinite(usdRate) || usdRate <= 0) return null;

    return {
      date: response?.data?.date || date,
      usdRate,
      eurRate: Number.isFinite(eurRate) && eurRate > 0 ? eurRate : null,
      usdtRate: Number.isFinite(Number(response?.data?.usdt_rate)) ? Number(response.data.usdt_rate) : null,
    };
  } catch (_error) {
    return null;
  }
}

// Weekends/holidays have no listed rate — walk back to the closest prior day that does.
async function getRateWithFallback(dateInput) {
  const target = resolveDateUtc(dateInput);
  const cached = getCached(target);
  if (cached) return cached;

  let cursor = target;
  for (let i = 0; i <= FALLBACK_MAX_DAYS_BACK; i++) {
    const cachedCursor = getCached(cursor);
    const rate = cachedCursor || await fetchRateFromProvider(cursor);
    if (rate) {
      setCached(target, rate);
      setCached(cursor, rate);
      return rate;
    }
    cursor = shiftDate(cursor, -1);
  }

  return null;
}

module.exports = { resolveDateUtc, fetchRateFromProvider, getRateWithFallback };
