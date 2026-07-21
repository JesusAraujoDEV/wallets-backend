'use strict';

const { Op, fn, col } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');
const { toMonthRange, toYearRange, currentUtcMonth } = require('./period_helpers');

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
  aggregateSpentByCategory,
  getBudgetStatus,
};
