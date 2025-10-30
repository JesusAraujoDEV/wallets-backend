const express = require('express');
const router = express.Router();
const axios = require('axios');
const { sequelize } = require('../libs/sequelize');
const pkg = require('../../package.json');

// Unprotected status endpoint
router.get('/', async (_req, res) => {
  const started = Date.now();
  const info = {
    name: pkg.name,
    version: pkg.version,
    env: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  // DB health
  let dbOk = false;
  let dbLatencyMs = null;
  let dbError = null;
  try {
    const t0 = Date.now();
    await sequelize.authenticate();
    await sequelize.query('SELECT 1');
    dbLatencyMs = Date.now() - t0;
    dbOk = true;
  } catch (e) {
    dbError = e.message;
  }

  // External dependency: exchange rate API
  let fxOk = false;
  let fxLatencyMs = null;
  let fxError = null;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const url = `https://api.dolarvzla.com/public/exchange-rate/list?from=${today}&to=${today}`;
    const t0 = Date.now();
    const r = await axios.get(url, { timeout: 2500 });
    fxLatencyMs = Date.now() - t0;
    fxOk = r.status >= 200 && r.status < 300;
  } catch (e) {
    fxError = e.message;
  }

  const ok = dbOk && fxOk;
  res.json({
    ok,
    info,
    components: {
      db: { ok: dbOk, latencyMs: dbLatencyMs, error: dbError || null },
      exchangeRateApi: { ok: fxOk, latencyMs: fxLatencyMs, error: fxError || null },
    },
    totalLatencyMs: Date.now() - started,
  });
});

module.exports = router;
