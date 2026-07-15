'use strict';
// One-off backfill: pulls the full paginated history from the BCV rates API
// and upserts it into our own exchange_rates table.
// Usage: node server/scripts/backfill_exchange_rates.js

require('dotenv').config();
const axios = require('axios');
const { sequelize, models } = require('../libs/sequelize');

const BCV_API_BASE_URL = (process.env.BCV_API_BASE_URL || 'https://bcv-api.irissoftware.lat').replace(/\/$/, '');
const PAGE_LIMIT = 200;

async function fetchPage(page) {
  const url = `${BCV_API_BASE_URL}/api/v1/exchange-rates/history?page=${page}&limit=${PAGE_LIMIT}`;
  const { data } = await axios.get(url, { timeout: 10000, headers: { accept: 'application/json' } });
  return data;
}

async function run() {
  await sequelize.authenticate();
  let page = 1;
  let totalUpserted = 0;
  let total = Infinity;

  while ((page - 1) * PAGE_LIMIT < total) {
    const res = await fetchPage(page);
    total = res.total ?? 0;
    const rows = res.data || [];
    if (!rows.length) break;

    for (const r of rows) {
      const usdRate = Number(r.dolar_rate);
      const eurRate = Number(r.euro_rate);
      if (!Number.isFinite(usdRate) || !Number.isFinite(eurRate)) continue;
      await models.ExchangeRate.upsert({
        date: r.date,
        usdRate,
        eurRate,
        usdtRate: r.usdt_rate == null ? null : Number(r.usdt_rate),
      });
      totalUpserted += 1;
    }

    console.log(`Page ${page}: upserted ${rows.length} rows (total so far: ${totalUpserted}/${total})`);
    page += 1;
  }

  console.log(`Backfill complete. ${totalUpserted} rows upserted.`);
  await sequelize.close();
}

run().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
