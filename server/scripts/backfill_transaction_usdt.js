'use strict';
// One-off backfill: for every transaction on/after the first date the BCV API
// carries a Binance USDT rate, stamp the USDT rate in effect that day and the
// USDT-equivalent amount. Purely informational — does not touch amountUsd or
// any accounting total. Usage: node server/scripts/backfill_transaction_usdt.js

require('dotenv').config();
const { Op } = require('sequelize');
const { sequelize, models } = require('../libs/sequelize');

async function loadRatesWithUsdt() {
  const rows = await models.ExchangeRate.findAll({
    where: { usdtRate: { [Op.ne]: null } },
    order: [['date', 'ASC']],
    raw: true,
  });
  return rows.map((r) => ({ date: r.date, usdRate: Number(r.usdRate), usdtRate: Number(r.usdtRate) }));
}

// Nearest rate on/before the transaction date (weekends/holidays carry the last known rate).
function findRateOnOrBefore(rates, date) {
  let match = null;
  for (const r of rates) {
    if (r.date > date) break;
    match = r;
  }
  return match;
}

async function run() {
  await sequelize.authenticate();
  const rates = await loadRatesWithUsdt();
  if (!rates.length) {
    console.log('No exchange_rates rows have a usdt_rate yet — run backfill_exchange_rates.js first.');
    await sequelize.close();
    return;
  }
  const firstDate = rates[0].date;
  console.log(`USDT rate coverage starts ${firstDate}. Backfilling transactions from that date onward.`);

  const transactions = await models.Transaction.findAll({
    where: { date: { [Op.gte]: firstDate }, amountUsd: { [Op.ne]: null } },
    attributes: ['id', 'date', 'amountUsd'],
    raw: true,
  });

  let updated = 0;
  let skipped = 0;
  for (const tx of transactions) {
    const rate = findRateOnOrBefore(rates, tx.date);
    if (!rate || !rate.usdtRate) { skipped += 1; continue; }

    const amountUsdt = Number(tx.amountUsd) * (rate.usdRate / rate.usdtRate);
    await models.Transaction.update(
      { usdtRateUsed: rate.usdtRate, amountUsdt: Math.round(amountUsdt * 100) / 100 },
      { where: { id: tx.id } },
    );
    updated += 1;
  }

  console.log(`Backfill complete. ${updated} transactions updated, ${skipped} skipped (no rate available).`);
  await sequelize.close();
}

run().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
