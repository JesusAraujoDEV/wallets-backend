const { models } = require('../../libs/sequelize');

function computeDebtStatus(totalAmount, paidAmount) {
  if (paidAmount >= totalAmount) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'pending';
}

async function calcDebtPaidAmountInTransaction(debtId, debtCurrency, transaction) {
  const rows = await models.Transaction.findAll({
    where: { debtId, status: 'completed' },
    attributes: ['amount', 'currency', 'amountUsd', 'exchangeRateUsed'],
    raw: true,
    transaction,
  });

  let total = 0;
  for (const tx of rows) {
    if (debtCurrency === 'USD') {
      total += tx.currency === 'USD' ? Number(tx.amount) : Number(tx.amountUsd || 0);
      continue;
    }

    if (debtCurrency === 'VES') {
      if (tx.currency === 'VES') {
        total += Number(tx.amount);
      } else if (tx.currency === 'USD' && tx.amountUsd && tx.exchangeRateUsed) {
        total += Number(tx.amountUsd) * Number(tx.exchangeRateUsed);
      } else {
        total += 0;
      }
      continue;
    }

    if (tx.currency === debtCurrency) {
      total += Number(tx.amount);
      continue;
    }

    total += Number(tx.amountUsd || 0);
  }

  return Math.round(total * 100) / 100;
}

async function syncLinkedDebtStatus(userId, debtId, transaction) {
  if (!debtId) return;

  const debt = await models.Debt.findOne({
    where: { id: debtId, userId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!debt) return;

  const paidAmount = await calcDebtPaidAmountInTransaction(debt.id, debt.currency, transaction);
  const newStatus = computeDebtStatus(Number(debt.totalAmount), paidAmount);

  if (debt.status !== newStatus) {
    await debt.update({ status: newStatus }, { transaction });
  }
}

module.exports = { computeDebtStatus, calcDebtPaidAmountInTransaction, syncLinkedDebtStatus };
