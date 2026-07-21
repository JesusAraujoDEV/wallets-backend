'use strict';

const { Op } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { BadRequestError, ConflictError, NotFoundError } = require('../../utils/errors');
const {
  normalizeSpecificMonth,
  normalizeRateSource,
  assertValidPeriod,
  assertValidSpecificMonthIfNeeded,
} = require('./period_helpers');

function shapeBudgetOutput(budget) {
  return {
    id: budget.id,
    userId: budget.userId,
    categoryId: budget.categoryId,
    amount: Number(budget.amount),
    currency: budget.currency,
    period: budget.period,
    specific_month: budget.specificMonth ?? null,
    rate_source: budget.rateSource ?? null,
  };
}

async function findDuplicateBudget({ userId, period, specificMonth, categoryId, excludeId = null }) {
  const where = {
    userId,
    period,
    categoryId,
    specificMonth: specificMonth ?? null,
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  return await models.Budget.findOne({
    where,
    attributes: ['id'],
  });
}

async function validateCategoryOwnershipAndType(userId, categoryId) {
  if (categoryId === null || categoryId === undefined) return;

  const category = await models.Category.findOne({
    where: { id: categoryId, userId },
    attributes: ['id', 'type'],
  });

  if (!category) throw new BadRequestError('La categoría no existe o no pertenece al usuario.');
  if (category.type !== 'gasto') throw new BadRequestError('Solo se pueden crear presupuestos para categorías de gasto.');
}

async function createBudget(userId, payload) {
  const period = payload.period;
  const categoryId = payload.categoryId === undefined ? null : payload.categoryId;
  const requestedSpecificMonth = normalizeSpecificMonth(payload);
  const specificMonth = period === 'one_time' ? requestedSpecificMonth : (requestedSpecificMonth ?? null);

  assertValidPeriod(period);
  assertValidSpecificMonthIfNeeded(period, specificMonth);

  await validateCategoryOwnershipAndType(userId, categoryId);

  const duplicate = await findDuplicateBudget({
    userId,
    period,
    specificMonth: period === 'one_time' ? specificMonth : null,
    categoryId,
  });

  if (duplicate) {
    throw new ConflictError('Ya existe un presupuesto para esa categoría y periodo en el alcance indicado.');
  }

  const created = await models.Budget.create({
    userId,
    categoryId,
    amount: payload.amount,
    currency: payload.currency || 'USD',
    period,
    specificMonth: period === 'one_time' ? specificMonth : null,
    rateSource: normalizeRateSource(payload) ?? null,
  });

  return shapeBudgetOutput(created);
}

async function listBudgets(userId, query = {}) {
  const where = { userId };
  if (query.period) where.period = query.period;
  if (query.month) where.specificMonth = query.month;

  const rows = await models.Budget.findAll({
    where,
    attributes: ['id', 'userId', 'categoryId', 'amount', 'currency', 'period', 'specificMonth', 'rateSource'],
    include: [{
      model: models.Category,
      attributes: ['id', 'name', 'icon', 'color'],
      required: false,
    }],
    order: [['specificMonth', 'DESC'], ['id', 'ASC']],
  });

  return rows.map((row) => ({
    ...shapeBudgetOutput(row),
    category: row.Category ? {
      id: row.Category.id,
      name: row.Category.name,
      icon: row.Category.icon,
      color: row.Category.color,
    } : null,
  }));
}

async function updateBudget(userId, budgetId, payload) {
  const budget = await models.Budget.findOne({
    where: { id: budgetId, userId },
    attributes: ['id', 'userId', 'categoryId', 'amount', 'currency', 'period', 'specificMonth', 'rateSource'],
  });

  if (!budget) throw new NotFoundError('Presupuesto no encontrado.');

  const period = payload.period;
  const specificMonthInput = normalizeSpecificMonth(payload);
  const specificMonth = period === 'one_time' ? specificMonthInput : (specificMonthInput ?? null);

  assertValidPeriod(period);
  assertValidSpecificMonthIfNeeded(period, specificMonth);

  if (payload.categoryId !== undefined) {
    await validateCategoryOwnershipAndType(userId, payload.categoryId);
  } else {
    await validateCategoryOwnershipAndType(userId, budget.categoryId);
  }

  const nextCategoryId = payload.categoryId === undefined ? budget.categoryId : payload.categoryId;
  const duplicate = await findDuplicateBudget({
    userId,
    period,
    specificMonth: period === 'one_time' ? specificMonth : null,
    categoryId: nextCategoryId,
    excludeId: budget.id,
  });

  if (duplicate) {
    throw new ConflictError('Ya existe un presupuesto para esa categoría y periodo en el alcance indicado.');
  }

  const updates = {
    amount: payload.amount,
    period,
    currency: payload.currency || budget.currency,
    specificMonth: period === 'one_time' ? specificMonth : null,
  };

  const rateSourceInput = normalizeRateSource(payload);
  if (rateSourceInput !== undefined) {
    updates.rateSource = rateSourceInput;
  }

  if (payload.categoryId !== undefined) {
    updates.categoryId = payload.categoryId;
  }

  await budget.update(updates);
  return shapeBudgetOutput(budget);
}

async function deleteBudget(userId, budgetId) {
  const rowCount = await models.Budget.destroy({
    where: { id: budgetId, userId },
  });

  if (!rowCount) throw new NotFoundError('Presupuesto no encontrado.');
  return { rowCount };
}

module.exports = {
  shapeBudgetOutput,
  findDuplicateBudget,
  validateCategoryOwnershipAndType,
  createBudget,
  listBudgets,
  updateBudget,
  deleteBudget,
};
