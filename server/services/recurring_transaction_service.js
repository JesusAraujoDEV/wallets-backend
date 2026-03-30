const dayjs = require('dayjs');
const { sequelize, models } = require('../libs/sequelize');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const transactionService = require('./transaction_service');
const { calculateNextDate } = require('./recurring_worker_service');

function normalizeInput(payload = {}) {
  const rawAccountId = payload.accountId ?? payload.account_id;
  const normalizedCurrency = typeof payload.currency === 'string' ? payload.currency.trim().toUpperCase() : undefined;
  return {
    type: payload.type,
    amount: payload.amount,
    currency: normalizedCurrency,
    description: payload.description,
    frequency: payload.frequency,
    startDate: payload.startDate ?? payload.start_date,
    accountId: rawAccountId === '' ? null : rawAccountId,
    categoryId: payload.categoryId ?? payload.category_id,
    executionMode: payload.executionMode ?? payload.execution_mode,
    isActive: payload.isActive ?? payload.is_active,
  };
}

function shapeRecurringTransaction(row) {
  return {
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    categoryId: row.categoryId,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    description: row.description,
    frequency: row.frequency,
    startDate: row.startDate,
    nextDate: row.nextDate,
    executionMode: row.executionMode,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function ensureOwnedReferences(userId, { accountId, categoryId, type }) {
  const accountPromise = accountId == null
    ? Promise.resolve(null)
    : models.Account.findOne({ where: { id: accountId, userId } });
  const [account, category] = await Promise.all([
    accountPromise,
    models.Category.findOne({ where: { id: categoryId, userId } }),
  ]);

  if (accountId != null && !account) {
    throw new BadRequestError('Cuenta no valida o no pertenece al usuario.');
  }
  if (!category) {
    throw new BadRequestError('Categoria no valida o no pertenece al usuario.');
  }
  if (type && category.type !== type) {
    throw new BadRequestError('El tipo de la categoria no coincide con el tipo de la recurrencia.');
  }

  return { account, category };
}

async function createRecurringTransaction(userId, payload = {}) {
  const data = normalizeInput(payload);

  const executionMode = data.executionMode ?? 'manual';
  if (executionMode === 'auto' && data.accountId == null) {
    throw new BadRequestError('Las recurrencias en modo auto requieren accountId.');
  }

  await ensureOwnedReferences(userId, {
    accountId: data.accountId,
    categoryId: data.categoryId,
    type: data.type,
  });

  const created = await models.RecurringTransaction.create({
    userId,
    accountId: data.accountId,
    categoryId: data.categoryId,
    type: data.type,
    amount: data.amount,
    currency: data.currency ?? 'USD',
    description: data.description,
    frequency: data.frequency,
    startDate: data.startDate,
    nextDate: data.startDate,
    executionMode,
    isActive: data.isActive ?? true,
  });

  return shapeRecurringTransaction(created);
}

async function listRecurringTransactions(userId) {
  const rows = await models.RecurringTransaction.findAll({
    where: { userId },
    order: [['nextDate', 'ASC'], ['id', 'ASC']],
  });
  return rows.map(shapeRecurringTransaction);
}

async function updateRecurringTransaction(userId, recurringId, payload = {}) {
  const data = normalizeInput(payload);

  const recurring = await models.RecurringTransaction.findOne({
    where: { id: recurringId, userId },
  });
  if (!recurring) return null;

  const nextAccountId = data.accountId ?? recurring.accountId;
  const nextCategoryId = data.categoryId ?? recurring.categoryId;
  const nextType = data.type ?? recurring.type;
  const nextExecutionMode = data.executionMode ?? recurring.executionMode;

  if (nextExecutionMode === 'auto' && nextAccountId == null) {
    throw new BadRequestError('Las recurrencias en modo auto requieren accountId.');
  }

  if (data.accountId != null || data.categoryId != null || data.type != null) {
    await ensureOwnedReferences(userId, {
      accountId: nextAccountId,
      categoryId: nextCategoryId,
      type: nextType,
    });
  } else if (data.accountId === null) {
    await ensureOwnedReferences(userId, {
      accountId: null,
      categoryId: nextCategoryId,
      type: nextType,
    });
  }

  const updates = {};
  if (typeof data.type !== 'undefined') updates.type = data.type;
  if (typeof data.amount !== 'undefined') updates.amount = data.amount;
  if (typeof data.currency !== 'undefined') updates.currency = data.currency;
  if (typeof data.description !== 'undefined') updates.description = data.description;
  if (typeof data.frequency !== 'undefined') updates.frequency = data.frequency;
  if (typeof data.startDate !== 'undefined') updates.startDate = data.startDate;
  if (typeof data.accountId !== 'undefined') updates.accountId = data.accountId;
  if (typeof data.categoryId !== 'undefined') updates.categoryId = data.categoryId;
  if (typeof data.executionMode !== 'undefined') updates.executionMode = data.executionMode;
  if (typeof data.isActive !== 'undefined') updates.isActive = data.isActive;

  await recurring.update(updates);
  return shapeRecurringTransaction(recurring);
}

async function deleteRecurringTransaction(userId, recurringId) {
  const rowCount = await models.RecurringTransaction.destroy({
    where: { id: recurringId, userId },
  });
  return { rowCount };
}

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

    // Resolve account to use its currency as fallback when frontend doesn't send one
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
    });

    const newNextDate = calculateNextDate(recurring.nextDate, recurring.frequency);
    await recurring.update({ nextDate: newNextDate }, { transaction: t });

    return shapeRecurringTransaction(recurring);
  });
}

module.exports = {
  createRecurringTransaction,
  listRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  payNowRecurringTransaction,
};
