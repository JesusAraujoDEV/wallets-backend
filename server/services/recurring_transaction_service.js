const { models } = require('../libs/sequelize');
const { BadRequestError } = require('../utils/errors');

function normalizeInput(payload = {}) {
  return {
    type: payload.type,
    amount: payload.amount,
    description: payload.description,
    frequency: payload.frequency,
    startDate: payload.startDate ?? payload.start_date,
    accountId: payload.accountId ?? payload.account_id,
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
  const [account, category] = await Promise.all([
    models.Account.findOne({ where: { id: accountId, userId } }),
    models.Category.findOne({ where: { id: categoryId, userId } }),
  ]);

  if (!account) {
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
    description: data.description,
    frequency: data.frequency,
    startDate: data.startDate,
    nextDate: data.startDate,
    executionMode: data.executionMode ?? 'manual',
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

  if (data.accountId != null || data.categoryId != null || data.type != null) {
    await ensureOwnedReferences(userId, {
      accountId: nextAccountId,
      categoryId: nextCategoryId,
      type: nextType,
    });
  }

  const updates = {};
  if (typeof data.type !== 'undefined') updates.type = data.type;
  if (typeof data.amount !== 'undefined') updates.amount = data.amount;
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

module.exports = {
  createRecurringTransaction,
  listRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
};
