const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');
const { getVesPerUsdByDate } = require('./exchange');
const { syncLinkedDebtStatus } = require('./debt_sync');

async function confirmPendingTransaction(txId, userId, confirmPayload = {}) {
  return await sequelize.transaction(async (t) => {
    const tx = await models.Transaction.findOne({
      where: { id: txId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!tx) return null;
    if (tx.status !== 'pending') {
      throw new BadRequestError('Solo se pueden confirmar transacciones pendientes.');
    }

    const finalAccountId = parseInt(confirmPayload.accountId, 10);
    if (!finalAccountId || Number.isNaN(finalAccountId)) {
      throw new BadRequestError('accountId es obligatorio para confirmar la transacción.');
    }

    const finalDate = confirmPayload.date || new Date().toISOString().slice(0, 10);
    const finalAmount = confirmPayload.amount != null ? Number(confirmPayload.amount) : Number(tx.amount);
    const finalCurrency = typeof confirmPayload.currency === 'string'
      ? confirmPayload.currency.trim().toUpperCase()
      : tx.currency;

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      throw new BadRequestError('El monto final de la transacción debe ser mayor a 0.');
    }

    const category = await models.Category.findOne({ where: { id: tx.categoryId, userId }, transaction: t });
    if (!category) throw new BadRequestError('Categoría no válida o no pertenece al usuario.');
    const account = await models.Account.findOne({ where: { id: finalAccountId, userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!account) throw new BadRequestError('Cuenta no válida o no pertenece al usuario.');

    if (finalCurrency !== account.currency) {
      throw new BadRequestError('La moneda final debe coincidir con la moneda de la cuenta seleccionada.');
    }

    if (category.type === 'gasto' && Number(account.balance) < finalAmount) {
      throw new BadRequestError('Fondos insuficientes para completar la transacción.');
    }

    const delta = category.type === 'ingreso' ? finalAmount : -finalAmount;
    const newBalance = Number(account.balance) + Number(delta);
    if (newBalance < 0) {
      throw new BadRequestError('Fondos insuficientes para completar la transacción.');
    }

    let amountUsd = null;
    let exchangeRateUsed = null;
    if (finalCurrency === 'VES') {
      exchangeRateUsed = await getVesPerUsdByDate(finalDate);
      amountUsd = finalAmount / Number(exchangeRateUsed);
    } else if (finalCurrency === 'USD') {
      amountUsd = finalAmount;
    }

    await account.update({ balance: newBalance }, { transaction: t });
    await tx.update({
      status: 'completed',
      accountId: finalAccountId,
      date: finalDate,
      amount: finalAmount,
      currency: finalCurrency,
      amountUsd,
      exchangeRateUsed,
    }, { transaction: t });

    await syncLinkedDebtStatus(userId, tx.debtId, t);

    return { tx };
  });
}

module.exports = { confirmPendingTransaction };
