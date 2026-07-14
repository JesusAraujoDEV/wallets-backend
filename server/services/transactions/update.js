const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');
const { getVesPerUsdByDate } = require('./exchange');

async function updateTransaction(txId, userId, txData) {
  const { description, amount, date, categoryId, accountId, currency } = txData;
  const categoryIdNum = categoryId != null ? parseInt(categoryId) : undefined;
  const accountIdNum = accountId != null ? parseInt(accountId) : undefined;

  return await sequelize.transaction(async (t) => {
    const oldTx = await models.Transaction.findOne({ where: { id: txId, userId }, transaction: t });
    if (!oldTx) return null;

    const newDescription = typeof description === 'string' ? description : oldTx.description;
    const newAmount = amount != null ? Number(amount) : Number(oldTx.amount);
    const newCurrency = typeof currency === 'string' ? currency : oldTx.currency;
    const newDate = date ? date : oldTx.date;
    const newCategoryId = categoryIdNum != null ? categoryIdNum : oldTx.categoryId;
    const newAccountId = accountIdNum != null ? accountIdNum : oldTx.accountId;

    const oldCategoryType = (await models.Category.findByPk(oldTx.categoryId, { transaction: t }))?.type;
    const oldAccount = await models.Account.findOne({ where: { id: oldTx.accountId, userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (oldTx.status === 'completed' && oldAccount) {
      const oldDelta = oldCategoryType === 'ingreso' ? -Number(oldTx.amount) : Number(oldTx.amount);
      await oldAccount.update({ balance: Number(oldAccount.balance) + oldDelta }, { transaction: t });
    }

    const newCategory = await models.Category.findOne({ where: { id: newCategoryId, userId }, transaction: t });
    if (!newCategory) throw new Error('Nueva categoría no es válida.');
    const newCategoryType = newCategory.type;

    const newAccount = await models.Account.findOne({ where: { id: newAccountId, userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!newAccount) throw new Error('Cuenta no válida.');

    if (oldTx.status === 'completed') {
      const newDelta = newCategoryType === 'ingreso' ? Number(newAmount) : -Number(newAmount);
      if (newCategoryType === 'gasto' && Number(newAccount.balance) < Number(newAmount)) {
        throw new BadRequestError('Fondos insuficientes para completar la transacción.');
      }
      await newAccount.update({ balance: Number(newAccount.balance) + newDelta }, { transaction: t });
    }

    let amountUsd = null;
    let exchangeRateUsed = null;
    if (newCurrency === 'VES') {
      exchangeRateUsed = await getVesPerUsdByDate(newDate);
      amountUsd = Number(newAmount) / Number(exchangeRateUsed);
    } else if (newCurrency === 'USD') {
      amountUsd = newAmount;
    }

    await oldTx.update({
      description: newDescription,
      amount: newAmount,
      currency: newCurrency,
      date: newDate,
      categoryId: newCategoryId,
      accountId: newAccountId,
      amountUsd,
      exchangeRateUsed,
    }, { transaction: t });

    return { tx: {
      id: oldTx.id,
      description: oldTx.description,
      amount: oldTx.amount,
      currency: oldTx.currency,
      date: oldTx.date,
      categoryId: oldTx.categoryId,
      accountId: oldTx.accountId,
      amountUsd: oldTx.amountUsd,
      exchangeRateUsed: oldTx.exchangeRateUsed,
      status: oldTx.status,
      type: newCategoryType === 'ingreso' ? 'income' : 'expense',
    }};
  });
}

module.exports = { updateTransaction };
