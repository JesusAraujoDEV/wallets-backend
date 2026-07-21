'use strict';

const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { getUsdRateByDate, resolveDateUtc } = require('../exchange_rate_service');
const { calcPaidAmount, computeStatus } = require('./shared');

async function payDebt(userId, debtId, payData) {
  const { amount, currency, accountId, date, categoryId, exchangeRate } = payData;
  const paymentDate = resolveDateUtc(date);

  return await sequelize.transaction(async (t) => {
    const debt = await models.Debt.findOne({
      where: { id: debtId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');
    if (debt.status === 'paid') throw new BadRequestError('Esta deuda ya está completamente pagada.');

    const account = await models.Account.findOne({
      where: { id: accountId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!account) throw new BadRequestError('Cuenta no válida o no pertenece al usuario.');

    const paymentCurrency = String(currency || '').trim().toUpperCase();
    const debtCurrency = String(debt.currency || '').trim().toUpperCase();
    const accountCurrency = String(account.currency || '').trim().toUpperCase();
    const debtAmount = Number(amount);
    const parsedExchangeRate = exchangeRate != null ? Number(exchangeRate) : null;

    if (paymentCurrency !== debtCurrency) {
      throw new BadRequestError('La moneda del abono debe coincidir con la moneda original de la deuda.');
    }

    const isExpense = debt.type === 'payable';
    const catType = isExpense ? 'gasto' : 'ingreso';

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && debt.categoryId) {
      const debtCat = await models.Category.findOne({
        where: { id: debt.categoryId, userId },
        transaction: t,
      });
      if (debtCat && debtCat.type === catType) {
        resolvedCategoryId = debtCat.id;
      }
    }
    if (!resolvedCategoryId) {
      const defaultCatName = isExpense ? 'Pago de Deuda' : 'Cobro de Deuda';
      let cat = await models.Category.findOne({
        where: { userId, type: catType, name: defaultCatName },
        transaction: t,
      });
      if (!cat) {
        cat = await models.Category.create({
          userId,
          name: defaultCatName,
          type: catType,
          icon: isExpense ? 'CreditCard' : 'Wallet',
          color: isExpense ? '#ef4444' : '#10b981',
          colorName: isExpense ? 'Red' : 'Emerald',
        }, { transaction: t });
      }
      resolvedCategoryId = cat.id;
    } else {
      const cat = await models.Category.findOne({
        where: { id: resolvedCategoryId, userId },
        transaction: t,
      });
      if (!cat) throw new BadRequestError('Categoría no válida o no pertenece al usuario.');
      if (cat.type !== catType) {
        throw new BadRequestError(
          `La categoría debe ser de tipo "${catType}" para una deuda ${debt.type === 'payable' ? 'por pagar' : 'por cobrar'}.`
        );
      }
    }

    let convertedAmount = debtAmount;
    let amountUsd = null;
    let exchangeRateUsed = null;

    if (debtCurrency === accountCurrency) {
      convertedAmount = debtAmount;
      if (accountCurrency === 'VES') {
        const { getVesPerUsdByDate } = require('../transaction_service');
        exchangeRateUsed = await getVesPerUsdByDate(paymentDate);
        amountUsd = debtAmount / Number(exchangeRateUsed);
      } else if (accountCurrency === 'USD') {
        amountUsd = debtAmount;
      }
    } else if (debtCurrency === 'USD' && accountCurrency === 'VES') {
      if (parsedExchangeRate != null && (!Number.isFinite(parsedExchangeRate) || parsedExchangeRate <= 0)) {
        throw new BadRequestError('exchangeRate debe ser mayor a 0 para convertir USD -> VES.');
      }
      exchangeRateUsed = parsedExchangeRate != null ? parsedExchangeRate : await getUsdRateByDate(paymentDate);
      convertedAmount = debtAmount * exchangeRateUsed;
      amountUsd = debtAmount;
    } else if (debtCurrency === 'VES' && accountCurrency === 'USD') {
      if (parsedExchangeRate != null && (!Number.isFinite(parsedExchangeRate) || parsedExchangeRate <= 0)) {
        throw new BadRequestError('exchangeRate debe ser mayor a 0 para convertir VES -> USD.');
      }
      exchangeRateUsed = parsedExchangeRate != null ? parsedExchangeRate : await getUsdRateByDate(paymentDate);
      convertedAmount = debtAmount / exchangeRateUsed;
      amountUsd = convertedAmount;
    } else {
      throw new BadRequestError(`Conversión no soportada entre deuda ${debtCurrency} y cuenta ${accountCurrency}.`);
    }

    if (isExpense && Number(account.balance) < Number(convertedAmount)) {
      throw new BadRequestError('Fondos insuficientes para completar el abono.');
    }

    if (accountCurrency === 'VES' && exchangeRateUsed == null) {
      const { getVesPerUsdByDate } = require('../transaction_service');
      exchangeRateUsed = await getVesPerUsdByDate(paymentDate);
      amountUsd = Number(convertedAmount) / Number(exchangeRateUsed);
    } else if (accountCurrency === 'USD' && amountUsd == null) {
      amountUsd = convertedAmount;
    }

    const delta = isExpense ? -Number(convertedAmount) : Number(convertedAmount);
    const newBalance = Number(account.balance) + delta;
    await account.update({ balance: newBalance }, { transaction: t });

    const description = isExpense
      ? `Abono a deuda: ${debt.contactName}`
      : `Cobro de deuda: ${debt.contactName}`;

    const tx = await models.Transaction.create({
      description,
      amount: convertedAmount,
      currency: accountCurrency,
      amountUsd,
      exchangeRateUsed,
      date: paymentDate,
      status: 'completed',
      categoryId: resolvedCategoryId,
      accountId,
      userId,
      debtId: debt.id,
    }, { transaction: t });

    const paidAmount = await calcPaidAmount(debt.id, debt.currency, t);
    const newStatus = computeStatus(Number(debt.totalAmount), paidAmount);
    await debt.update({ status: newStatus }, { transaction: t });

    return {
      debt: {
        id: debt.id,
        status: newStatus,
        totalAmount: Number(debt.totalAmount),
        paidAmount,
        remaining: Math.max(0, Number(debt.totalAmount) - paidAmount),
      },
      transaction: {
        id: tx.id,
        description: tx.description,
        amount: Number(tx.amount),
        currency: tx.currency,
        amountUsd: tx.amountUsd ? Number(tx.amountUsd) : null,
        exchangeRateUsed: tx.exchangeRateUsed ? Number(tx.exchangeRateUsed) : null,
        date: tx.date,
        status: tx.status,
        categoryId: tx.categoryId,
        accountId: tx.accountId,
        debtId: tx.debtId,
      },
    };
  });
}

module.exports = { payDebt };
