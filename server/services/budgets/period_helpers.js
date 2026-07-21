'use strict';

const { BadRequestError } = require('../../utils/errors');

const ALLOWED_PERIODS = new Set(['monthly', 'yearly', 'one_time']);

function toMonthRange(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return null;
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function toYearRange(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return null;
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

function currentUtcMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function normalizeSpecificMonth(payload = {}) {
  if (Object.prototype.hasOwnProperty.call(payload, 'specific_month')) return payload.specific_month;
  if (Object.prototype.hasOwnProperty.call(payload, 'specificMonth')) return payload.specificMonth;
  return undefined;
}

function normalizeRateSource(payload = {}) {
  if (Object.prototype.hasOwnProperty.call(payload, 'rate_source')) return payload.rate_source;
  if (Object.prototype.hasOwnProperty.call(payload, 'rateSource')) return payload.rateSource;
  return undefined;
}

function assertValidPeriod(period) {
  if (!ALLOWED_PERIODS.has(period)) {
    throw new BadRequestError('period debe ser monthly, yearly o one_time.');
  }
}

function assertValidSpecificMonthIfNeeded(period, specificMonth) {
  if (period === 'one_time' && !specificMonth) {
    throw new BadRequestError('specific_month es requerido cuando period es one_time.');
  }
}

module.exports = {
  toMonthRange,
  toYearRange,
  currentUtcMonth,
  normalizeSpecificMonth,
  normalizeRateSource,
  assertValidPeriod,
  assertValidSpecificMonthIfNeeded,
};
