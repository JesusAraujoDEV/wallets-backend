const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');
const { getVesPerUsdByDate } = require('./exchange');
const { findOrCreateCategoryByName, findCategoryGroupIdByBehavior } = require('./category_helpers');

async function createTransactionInT(t, userId, txData) {
  const {
    description,
    amount,
    currency,
    date,
    categoryId,
    accountId,
    status = 'completed',
    applyBalance = true,
    debtId = null,
  } = txData;
  let amountUsd = null;
  let exchangeRateUsed = null;
  if (currency === 'VES') {
    exchangeRateUsed = await getVesPerUsdByDate(date);
    amountUsd = Number(amount) / Number(exchangeRateUsed);
  } else if (currency === 'USD') {
    amountUsd = amount;
  }

  const category = await models.Category.findOne({ where: { id: categoryId, userId }, transaction: t });
  if (!category) throw new Error('Categoría no válida o no pertenece al usuario.');
  const categoryType = category.type; // 'ingreso' | 'gasto'
  const delta = categoryType === 'ingreso' ? Number(amount) : -Number(amount);

  if (accountId == null) {
    if (status !== 'pending') {
      throw new BadRequestError('La cuenta es obligatoria para transacciones no pendientes.');
    }
    if (applyBalance) {
      throw new BadRequestError('No se puede aplicar balance en transacciones pendientes sin cuenta.');
    }
  }

  let account = null;
  if (accountId != null) {
    account = await models.Account.findOne({
      where: { id: accountId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!account) throw new Error('Cuenta no válida o no pertenece al usuario.');

    if (applyBalance && currency !== account.currency) {
      throw new BadRequestError('La moneda de la transacción debe coincidir con la moneda de la cuenta.');
    }

    if (applyBalance && categoryType === 'gasto' && Number(account.balance) < Number(amount)) {
      throw new BadRequestError('Fondos insuficientes para completar la transacción.');
    }
  }

  if (applyBalance && account) {
    const newBalance = Number(account.balance) + Number(delta);
    if (newBalance < 0) {
      throw new BadRequestError('Fondos insuficientes para completar la transacción.');
    }
    await account.update({ balance: newBalance }, { transaction: t });
  }

  const created = await models.Transaction.create({
    description,
    amount,
    currency,
    amountUsd,
    exchangeRateUsed,
    date,
    status,
    categoryId,
    accountId,
    userId,
    debtId,
  }, { transaction: t });

  return { tx: {
    id: created.id,
    description: created.description,
    amount: created.amount,
    currency: created.currency,
    amountUsd: created.amountUsd,
    exchangeRateUsed: created.exchangeRateUsed,
    date: created.date,
    status: created.status,
    categoryId: created.categoryId,
    accountId: created.accountId,
    type: categoryType === 'ingreso' ? 'income' : 'expense',
  }};
}

async function createTransaction(userId, txData) {
  return await sequelize.transaction(async (t) => {
    const main = await createTransactionInT(t, userId, { ...txData, status: 'completed', applyBalance: true });

    const comm = Number(txData?.commission || 0);
    let commissionTx = null;
    if (comm && comm > 0) {
      const includeGroupId = await findCategoryGroupIdByBehavior(userId, 'include', t);
      const catCommission = await findOrCreateCategoryByName(userId, 'Comision', 'gasto', t, {
        icon: 'Percent',
        color: '#ef4444',
        colorName: 'Red',
        groupId: includeGroupId,
        isSystem: true,
      });
      const descCom = `Comision de: ${txData.description}`;
      const commission = await createTransactionInT(t, userId, {
        description: descCom,
        amount: comm,
        currency: txData.currency,
        date: txData.date,
        status: 'completed',
        applyBalance: true,
        categoryId: catCommission.id,
        accountId: txData.accountId,
      });
      commissionTx = commission.tx;
    }

    return { tx: main.tx, commissionTx };
  });
}

module.exports = { createTransactionInT, createTransaction };
