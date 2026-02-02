const axios = require('axios');
const { sequelize } = require('../libs/sequelize');
const pkg = require('../../package.json');

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
  const today = new Date().toISOString().slice(0, 10);
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
