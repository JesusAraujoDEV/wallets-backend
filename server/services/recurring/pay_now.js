'use strict';

const dayjs = require('dayjs');
const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const transactionService = require('../transaction_service');
const { calculateNextDate } = require('../recurring_worker_service');
const { shapeRecurringTransaction } = require('./shared');

async function payNowRecurringTransaction(userId, recurringId, payload = {}) {
  return await sequelize.transaction(async (t) => {
    const recurring = await models.RecurringTransaction.findOne({
      where: { id: recurringId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!recurring) throw new NotFoundError('Transaccion recurrente no encontrada.');
    if (!recurring.isActive) throw new BadRequestError('La suscripcion esta inactiva.');

    const accountId = payload.accountId ?? payload.account_id ?? recurring.accountId;
    if (accountId == null) {
      throw new BadRequestError('Se requiere accountId para adelantar el pago.');
    }

    const account = await models.Account.findOne({
      where: { id: accountId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!account) throw new BadRequestError('Cuenta no valida o no pertenece al usuario.');

    const payDate = payload.date || dayjs().format('YYYY-MM-DD');
    const payAmount = payload.amount !== undefined ? payload.amount : recurring.amount;
    const payCurrency = typeof payload.currency === 'string'
      ? payload.currency.trim().toUpperCase()
      : account.currency;

    await transactionService.createTransactionInT(t, userId, {
      description: recurring.description,
      amount: payAmount,
      currency: payCurrency,
      date: payDate,
      categoryId: recurring.categoryId,
      accountId,
      status: 'completed',
      applyBalance: true,
      debtId: recurring.debtId || null,
    });

    const newNextDate = calculateNextDate(recurring.nextDate, recurring.frequency);
    await recurring.update({ nextDate: newNextDate }, { transaction: t });

    return shapeRecurringTransaction(recurring);
  });
}

module.exports = { payNowRecurringTransaction };
