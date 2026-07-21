const { Op, fn, col } = require('sequelize');
const { models } = require('../libs/sequelize');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');

const ALLOWED_PERIODS = new Set(['monthly', 'yearly', 'one_time']);

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

function toYearRange(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return null;
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);

  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
  };
}

function currentUtcMonth() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function normalizeSpecificMonth(payload = {}) {
  if (Object.prototype.hasOwnProperty.call(payload, 'specific_month')) return payload.specific_month;
  if (Object.prototype.hasOwnProperty.call(payload, 'specificMonth')) return payload.specificMonth;
  return undefined;
}

function normalizeRateSource(payload = {}) {
  if (Object.prototype.hasOwnProperty.call(payload, 'rate_source')) return payload.rate_source;
  if (Object.prototype.hasOwnProperty.call(payload, 'rateSource')) return payload.rateSource;
  return undefined;
}

function assertValidPeriod(period) {
  if (!ALLOWED_PERIODS.has(period)) {
    throw new BadRequestError('period debe ser monthly, yearly o one_time.');
  }
}

function assertValidSpecificMonthIfNeeded(period, specificMonth) {
  if (period === 'one_time' && !specificMonth) {
    throw new BadRequestError('specific_month es requerido cuando period es one_time.');
  }
}

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

async function listBudgetableCategoryIds(userId) {
  const categories = await models.Category.findAll({
    attributes: ['id'],
    where: { userId, type: 'gasto' },
    include: [{ model: models.CategoryGroup, attributes: ['analyticsBehavior'], required: false }],
  });

  // A category with no group is not opted out of anything — only an explicit
  // 'exclude' group (e.g. transfers) should hide it from budget tracking.
  return categories
    .filter((c) => !c.CategoryGroup || c.CategoryGroup.analyticsBehavior === 'include')
    .map((c) => c.id);
}

async function aggregateSpentByCategory(userId, range) {
  const categoryIds = await listBudgetableCategoryIds(userId);
  if (categoryIds.length === 0) return { byCategory: new Map(), total: 0 };

  const rows = await models.Transaction.findAll({
    attributes: [
      [col('Transaction.category_id'), 'categoryId'],
      [fn('COALESCE', fn('SUM', col('Transaction.amount_usd')), 0), 'spentUsd'],
    ],
    where: {
      userId,
      date: { [Op.gte]: range.from, [Op.lte]: range.to },
      categoryId: { [Op.in]: categoryIds },
    },
    group: [col('Transaction.category_id')],
    raw: true,
  });

  const byCategory = new Map();
  let total = 0;
  for (const row of rows) {
    const categoryId = Number(row.categoryId);
    const spent = Number(row.spentUsd || 0);
    byCategory.set(categoryId, spent);
    total += spent;
  }

  return { byCategory, total };
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

async function getBudgetStatus(userId, monthParam) {
  const month = monthParam || currentUtcMonth();
  const monthRange = toMonthRange(month);
  const yearRange = toYearRange(month);
  if (!monthRange || !yearRange) throw new BadRequestError('month debe tener formato YYYY-MM válido.');

  const budgets = await models.Budget.findAll({
    where: {
      userId,
      [Op.or]: [
        { period: 'monthly' },
        { period: 'yearly' },
        { period: 'one_time', specificMonth: month },
      ],
    },
    attributes: ['id', 'categoryId', 'amount', 'currency', 'period', 'specificMonth', 'rateSource'],
    include: [{
      model: models.Category,
      attributes: ['id', 'name', 'icon', 'color'],
      required: false,
    }],
    order: [['id', 'ASC']],
  });

  if (!budgets.length) return [];

  const [monthlySpent, yearlySpent] = await Promise.all([
    aggregateSpentByCategory(userId, monthRange),
    aggregateSpentByCategory(userId, yearRange),
  ]);

  return budgets.map((budget) => {
    const spentMap = budget.period === 'yearly' ? yearlySpent.byCategory : monthlySpent.byCategory;
    const totalSpent = budget.period === 'yearly' ? yearlySpent.total : monthlySpent.total;
    const budgeted = Number(budget.amount || 0);
    const spent = budget.categoryId == null
      ? totalSpent
      : Number(spentMap.get(Number(budget.categoryId)) || 0);
    const remaining = budgeted - spent;
    const percentageUsed = budgeted > 0 ? Number(((spent / budgeted) * 100).toFixed(2)) : 0;

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
      specific_month: budget.specificMonth ?? null,
      rate_source: budget.rateSource ?? null,
    };
  });
}

module.exports = {
  createBudget,
  listBudgets,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
};