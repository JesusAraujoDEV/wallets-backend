'use strict';

const axios = require('axios');
const { BadRequestError } = require('../utils/errors');

const BCV_API_BASE_URL = (process.env.BCV_API_BASE_URL || 'https://bcv-api.irissoftware.lat').replace(/\/$/, '');
const BCV_API_TIMEOUT_MS = Number(process.env.BCV_API_TIMEOUT_MS || 5000);
const CACHE_TTL_MS = Number(process.env.BCV_RATE_CACHE_TTL_MS || 10 * 60 * 1000);

const usdRateCache = new Map();

function resolveDateUtc(dateInput) {
  if (dateInput && typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }

  return new Date().toISOString().slice(0, 10);
}

function getCachedUsdRate(date) {
  const cached = usdRateCache.get(date);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    usdRateCache.delete(date);
    return null;
  }

  return cached.value;
}

function setCachedUsdRate(date, value) {
  usdRateCache.set(date, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function getUsdRateByDate(dateInput) {
  const date = resolveDateUtc(dateInput);
  const cachedValue = getCachedUsdRate(date);
  if (cachedValue != null) return cachedValue;

  const url = `${BCV_API_BASE_URL}/api/v1/exchange-rates?date=${date}`;

  try {
    const response = await axios.get(url, {
      timeout: BCV_API_TIMEOUT_MS,
      headers: { accept: 'application/json' },
    });

    const usdRate = Number(response?.data?.usd_rate);
    if (!Number.isFinite(usdRate) || usdRate <= 0) {
      throw new Error('Invalid BCV response');
    }

    setCachedUsdRate(date, usdRate);
    return usdRate;
  } catch (_error) {
    throw new BadRequestError(
      'No se pudo obtener la tasa BCV para la fecha indicada. Envia exchangeRate manual para continuar.'
    );
  }
}

module.exports = {
  getUsdRateByDate,
  resolveDateUtc,
};
