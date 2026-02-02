const axios = require('axios');
const { sequelize } = require('../libs/sequelize');
const pkg = require('../../package.json');

function normalizeBcvDate(input) {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) return new Date();
  const day = d.getUTCDay();
  if (day === 6) d.setUTCDate(d.getUTCDate() - 1); // Saturday -> Friday
  if (day === 0) d.setUTCDate(d.getUTCDate() - 2); // Sunday -> Friday
  return d;
}

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function checkDb() {
  const t0 = Date.now();
  try {
    await sequelize.authenticate();
    await sequelize.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - t0, error: null };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e.message };
  }
}

async function checkExchangeRateApi() {
  const today = toIsoDate(normalizeBcvDate());
  const url = `https://bcv-api.irissoftware.lat/api/v1/bcv?date=${today}`;
  const t0 = Date.now();
  try {
    const r = await axios.get(url, { timeout: 2500, headers: { 'x-dolarvzla-key': process.env.BCV_API_KEY } });
    return { ok: r.status >= 200 && r.status < 300, latencyMs: Date.now() - t0, error: null };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - t0, error: e.message };
  }
}

async function getStatus() {
  const info = {
    name: pkg.name,
    version: pkg.version,
    env: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
  const started = Date.now();
  const [db, fx] = await Promise.all([checkDb(), checkExchangeRateApi()]);
  const ok = db.ok && fx.ok;
  return {
    ok,
    info,
    components: {
      db,
      exchangeRateApi: fx,
    },
    totalLatencyMs: Date.now() - started,
  };
}

module.exports = { getStatus };
