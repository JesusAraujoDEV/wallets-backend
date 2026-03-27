const { Op, fn, col } = require('sequelize');
const { models } = require('../libs/sequelize');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

function toMonthRange(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return null;
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function currentUtcMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
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
  const month = payload.month;
  const period = payload.period || 'monthly';
  const categoryId = payload.categoryId === undefined ? null : payload.categoryId;

  await validateCategoryOwnershipAndType(userId, categoryId);

  const duplicate = await models.Budget.findOne({
    where: {
      userId,
      period,
      month,
      categoryId,
    },
    attributes: ['id'],
  });

  if (duplicate) {
    throw new ConflictError('Ya existe un presupuesto para esa categoría y periodo en el mes indicado.');
  }

  const created = await models.Budget.create({
    userId,
    categoryId,
    amount: payload.amount,
    currency: payload.currency || 'USD',
    period,
    month,
  });

  return {
    id: created.id,
    userId: created.userId,
    categoryId: created.categoryId,
    amount: Number(created.amount),
    currency: created.currency,
    period: created.period,
    month: created.month,
  };
}

async function listBudgets(userId, query = {}) {
  const where = { userId };
  if (query.month) where.month = query.month;
  if (query.period) where.period = query.period;

  const rows = await models.Budget.findAll({
    where,
    attributes: ['id', 'userId', 'categoryId', 'amount', 'currency', 'period', 'month'],
    include: [{
      model: models.Category,
      attributes: ['id', 'name', 'icon', 'color'],
      required: false,
    }],
    order: [['month', 'DESC'], ['id', 'ASC']],
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    amount: Number(row.amount),
    currency: row.currency,
    period: row.period,
    month: row.month,
    category: row.Category ? {
      id: row.Category.id,
      name: row.Category.name,
      icon: row.Category.icon,
      color: row.Category.color,
    } : null,
  }));
}

async function updateBudgetAmount(userId, budgetId, amount) {
  const budget = await models.Budget.findOne({
    where: { id: budgetId, userId },
    attributes: ['id', 'userId', 'categoryId', 'amount', 'currency', 'period', 'month'],
  });

  if (!budget) throw new NotFoundError('Presupuesto no encontrado.');

  await budget.update({ amount });
  return {
    id: budget.id,
    userId: budget.userId,
    categoryId: budget.categoryId,
    amount: Number(budget.amount),
    currency: budget.currency,
    period: budget.period,
    month: budget.month,
  };
}

async function deleteBudget(userId, budgetId) {
  const rowCount = await models.Budget.destroy({
    where: { id: budgetId, userId },
  });

  if (!rowCount) throw new NotFoundError('Presupuesto no encontrado.');
  return { rowCount };
}

async function getBudgetStatus(userId, monthParam) {
  const month = monthParam || currentUtcMonth();
  const range = toMonthRange(month);
  if (!range) throw new BadRequestError('month debe tener formato YYYY-MM válido.');

  const budgets = await models.Budget.findAll({
    where: { userId, month, period: 'monthly' },
    attributes: ['id', 'categoryId', 'amount', 'currency', 'period', 'month'],
    include: [{
      model: models.Category,
      attributes: ['id', 'name', 'icon', 'color'],
      required: false,
    }],
    order: [['id', 'ASC']],
  });

  if (!budgets.length) return [];

  const spentRows = await models.Transaction.findAll({
    attributes: [
      [col('Transaction.category_id'), 'categoryId'],
      [fn('COALESCE', fn('SUM', col('Transaction.amount_usd')), 0), 'spentUsd'],
    ],
    where: {
      userId,
      date: { [Op.gte]: range.from, [Op.lte]: range.to },
    },
    include: [{
      model: models.Category,
      attributes: [],
      where: { type: 'gasto' },
      required: true,
      include: [{
        model: models.CategoryGroup,
        attributes: [],
        where: { analyticsBehavior: 'include' },
        required: true,
      }],
    }],
    group: [col('Transaction.category_id')],
    raw: true,
  });

  const spentByCategory = new Map(
    spentRows.map((row) => [Number(row.categoryId), Number(row.spentUsd || 0)]),
  );
  let totalSpent = 0;
  spentByCategory.forEach((value) => {
    totalSpent += value;
  });

  return budgets.map((budget) => {
    const budgeted = Number(budget.amount || 0);
    const spent = budget.categoryId == null
      ? totalSpent
      : Number(spentByCategory.get(Number(budget.categoryId)) || 0);
    const remaining = budgeted - spent;
    const percentageUsed = budgeted > 0 ? Number((spent / budgeted).toFixed(6)) : 0;

    return {
      id: budget.id,
      category: budget.Category ? {
        id: budget.Category.id,
        name: budget.Category.name,
        icon: budget.Category.icon,
        color: budget.Category.color,
      } : null,
      budgeted,
      spent,
      remaining,
      percentageUsed,
      currency: budget.currency,
      period: budget.period,
      month: budget.month,
    };
  });
}

module.exports = {
  createBudget,
  listBudgets,
  updateBudgetAmount,
  deleteBudget,
  getBudgetStatus,
};