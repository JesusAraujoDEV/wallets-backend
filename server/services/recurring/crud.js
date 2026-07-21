'use strict';

const { models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');
const { normalizeInput, shapeRecurringTransaction, ensureOwnedReferences } = require('./shared');

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
    debtId: data.debtId || null,
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
  if (typeof data.nextDate !== 'undefined') updates.nextDate = data.nextDate;
  if (typeof data.debtId !== 'undefined') updates.debtId = data.debtId;

  await recurring.update(updates);
  return shapeRecurringTransaction(recurring);
}

async function deleteRecurringTransaction(userId, recurringId) {
  const rowCount = await models.RecurringTransaction.destroy({
    where: { id: recurringId, userId },
  });
  return { rowCount };
}

module.exports = {
  createRecurringTransaction,
  listRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
};
