'use strict';

const { models } = require('../../libs/sequelize');

async function calcPaidAmount(debtId, debtCurrency, transaction = null) {
  const opts = {
    where: { debtId, status: 'completed' },
    attributes: ['amount', 'currency', 'amountUsd', 'exchangeRateUsed'],
    raw: true,
  };
  if (transaction) opts.transaction = transaction;
  const rows = await models.Transaction.findAll(opts);

  let total = 0;
  for (const tx of rows) {
    if (debtCurrency === 'USD') {
      const val = tx.currency === 'USD'
        ? Number(tx.amount)
        : Number(tx.amountUsd || 0);
      total += val;
    } else if (debtCurrency === 'VES') {
      if (tx.currency === 'VES') {
        total += Number(tx.amount);
      } else if (tx.currency === 'USD' && tx.amountUsd && tx.exchangeRateUsed) {
        total += Number(tx.amountUsd) * Number(tx.exchangeRateUsed);
      } else {
        total += 0;
      }
    } else {
      if (tx.currency === debtCurrency) {
        total += Number(tx.amount);
      } else if (tx.amountUsd) {
        total += Number(tx.amountUsd);
      }
    }
  }

  return Math.round(total * 100) / 100;
}

function computeStatus(totalAmount, paidAmount) {
  if (paidAmount >= totalAmount) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'pending';
}

module.exports = { calcPaidAmount, computeStatus };
