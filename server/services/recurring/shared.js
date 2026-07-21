'use strict';

const { models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');

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
    nextDate: payload.nextDate ?? payload.next_date,
    accountId: rawAccountId === '' ? null : rawAccountId,
    categoryId: payload.categoryId ?? payload.category_id,
    executionMode: payload.executionMode ?? payload.execution_mode,
    isActive: payload.isActive ?? payload.is_active,
    debtId: payload.debtId ?? payload.debt_id,
  };
}

function shapeRecurringTransaction(row) {
  return {
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    categoryId: row.categoryId,
    debtId: row.debtId || null,
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

module.exports = { normalizeInput, shapeRecurringTransaction, ensureOwnedReferences };
