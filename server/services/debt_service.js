const { fn, col, literal } = require('sequelize');
const { sequelize, models } = require('../libs/sequelize');
const { BadRequestError, NotFoundError } = require('../utils/errors');

async function listDebts(userId, filters = {}) {
  const where = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  const debts = await models.Debt.findAll({
    where,
    attributes: [
      'id', 'type',
      ['contact_name', 'contactName'],
      'description',
      ['total_amount', 'totalAmount'],
      'currency',
      ['due_date', 'dueDate'],
      'status',
      ['created_at', 'createdAt'],
      ['updated_at', 'updatedAt'],
      [
        literal(`(
          SELECT COALESCE(SUM(t.amount), 0)
          FROM transactions t
          WHERE t.debt_id = "Debt".id AND t.status = 'completed'
        )`),
        'paidAmount',
      ],
    ],
    order: [['created_at', 'DESC']],
    raw: true,
  });

  return debts.map((d) => ({
    ...d,
    totalAmount: Number(d.totalAmount),
    paidAmount: Number(d.paidAmount),
    remaining: Math.max(0, Number(d.totalAmount) - Number(d.paidAmount)),
  }));
}

async function getDebtById(userId, debtId) {
  const debt = await models.Debt.findOne({
    where: { id: debtId, userId },
  });
  if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');
  return debt;
}

async function createDebt(userId, data) {
  const debt = await models.Debt.create({
    userId,
    type: data.type,
    contactName: data.contactName,
    description: data.description || null,
    totalAmount: data.totalAmount,
    currency: data.currency || 'USD',
    dueDate: data.dueDate || null,
    status: 'pending',
  });

  return {
    id: debt.id,
    type: debt.type,
    contactName: debt.contactName,
    description: debt.description,
    totalAmount: Number(debt.totalAmount),
    currency: debt.currency,
    dueDate: debt.dueDate,
    status: debt.status,
    paidAmount: 0,
    remaining: Number(debt.totalAmount),
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
  };
}

async function updateDebt(userId, debtId, data) {
  const debt = await models.Debt.findOne({ where: { id: debtId, userId } });
  if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');

  if (data.contactName !== undefined) debt.contactName = data.contactName;
  if (data.description !== undefined) debt.description = data.description;
  if (data.dueDate !== undefined) debt.dueDate = data.dueDate;
  if (data.totalAmount !== undefined) debt.totalAmount = data.totalAmount;

  await debt.save();

  // Recalcular paid_amount para actualizar status
  const paidAmount = await calcPaidAmount(debtId);
  const newStatus = computeStatus(Number(debt.totalAmount), paidAmount);
  if (debt.status !== newStatus) {
    debt.status = newStatus;
    await debt.save();
  }

  return {
    id: debt.id,
    type: debt.type,
    contactName: debt.contactName,
    description: debt.description,
    totalAmount: Number(debt.totalAmount),
    currency: debt.currency,
    dueDate: debt.dueDate,
    status: debt.status,
    paidAmount,
    remaining: Math.max(0, Number(debt.totalAmount) - paidAmount),
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
  };
}

async function deleteDebt(userId, debtId) {
  const debt = await models.Debt.findOne({ where: { id: debtId, userId } });
  if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');

  // SET NULL en las transacciones vinculadas (la FK ya lo hace, pero lo hacemos explícito)
  await models.Transaction.update(
    { debtId: null },
    { where: { debtId: debt.id } },
  );

  await debt.destroy();
  return { rowCount: 1 };
}

async function payDebt(userId, debtId, payData) {
  const { amount, currency, accountId, date, categoryId } = payData;

  return await sequelize.transaction(async (t) => {
    const debt = await models.Debt.findOne({
      where: { id: debtId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');
    if (debt.status === 'paid') throw new BadRequestError('Esta deuda ya está completamente pagada.');

    // Validar cuenta
    const account = await models.Account.findOne({
      where: { id: accountId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!account) throw new BadRequestError('Cuenta no válida o no pertenece al usuario.');

    if (currency !== account.currency) {
      throw new BadRequestError('La moneda del abono debe coincidir con la moneda de la cuenta.');
    }

    // Determinar tipo de categoría según tipo de deuda
    // payable (yo debo) -> gasto | receivable (me deben) -> ingreso
    const isExpense = debt.type === 'payable';
    const catType = isExpense ? 'gasto' : 'ingreso';

    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId) {
      // Buscar o crear categoría por defecto para abonos de deuda
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
      // Validar que la categoría pertenece al usuario y es del tipo correcto
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

    // Validar fondos si es gasto
    if (isExpense && Number(account.balance) < Number(amount)) {
      throw new BadRequestError('Fondos insuficientes para completar el abono.');
    }

    // Calcular conversión de moneda
    let amountUsd = null;
    let exchangeRateUsed = null;
    if (currency === 'VES') {
      const { getVesPerUsdByDate } = require('./transaction_service');
      exchangeRateUsed = await getVesPerUsdByDate(date);
      amountUsd = Number(amount) / Number(exchangeRateUsed);
    } else if (currency === 'USD') {
      amountUsd = amount;
    }

    // Actualizar balance de la cuenta
    const delta = isExpense ? -Number(amount) : Number(amount);
    const newBalance = Number(account.balance) + delta;
    await account.update({ balance: newBalance }, { transaction: t });

    // Crear la transacción vinculada a la deuda
    const description = isExpense
      ? `Abono a deuda: ${debt.contactName}`
      : `Cobro de deuda: ${debt.contactName}`;

    const tx = await models.Transaction.create({
      description,
      amount,
      currency,
      amountUsd,
      exchangeRateUsed,
      date,
      status: 'completed',
      categoryId: resolvedCategoryId,
      accountId,
      userId,
      debtId: debt.id,
    }, { transaction: t });

    // Recalcular paid_amount y actualizar status
    const paidAmount = await calcPaidAmount(debt.id, t);
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

async function calcPaidAmount(debtId, transaction = null) {
  const opts = {
    where: { debtId, status: 'completed' },
    attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
    raw: true,
  };
  if (transaction) opts.transaction = transaction;
  const result = await models.Transaction.findOne(opts);
  return Number(result?.total || 0);
}

function computeStatus(totalAmount, paidAmount) {
  if (paidAmount >= totalAmount) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'pending';
}

module.exports = {
  listDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
  payDebt,
};
