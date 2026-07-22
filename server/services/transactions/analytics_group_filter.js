const { Op } = require('sequelize');
const { models } = require('../../libs/sequelize');

// Categories with no group are analytics-"include" by default: grouping is an opt-in
// mechanism to EXCLUDE a bucket (e.g. work-related income) from personal totals, not a
// requirement to be counted at all. Resolves the requested behavior/group into a category-id
// filter the caller merges into its own categoryId where clause; null means "no filtering needed".
async function resolveAnalyticsCategoryFilter({ userId, behavior, groupId }) {
  if (!behavior && groupId === null) return null;

  if (groupId !== null) {
    const groupWhere = { userId, id: groupId };
    if (behavior) groupWhere.analyticsBehavior = behavior;
    const groups = await models.CategoryGroup.findAll({ where: groupWhere, attributes: ['id'], raw: true });
    const cats = await findCategoriesInGroups(userId, groups);
    return { op: 'in', categoryIds: cats };
  }

  if (behavior === 'exclude') {
    const groups = await models.CategoryGroup.findAll({ where: { userId, analyticsBehavior: 'exclude' }, attributes: ['id'], raw: true });
    const cats = await findCategoriesInGroups(userId, groups);
    return { op: 'in', categoryIds: cats };
  }

  // behavior === 'include' (the default): everything except categories in an excluded group.
  const excludedGroups = await models.CategoryGroup.findAll({ where: { userId, analyticsBehavior: 'exclude' }, attributes: ['id'], raw: true });
  if (!excludedGroups.length) return null;
  const cats = await findCategoriesInGroups(userId, excludedGroups);
  if (!cats.length) return null;
  return { op: 'notIn', categoryIds: cats };
}

async function findCategoriesInGroups(userId, groups) {
  if (!groups.length) return [];
  const cats = await models.Category.findAll({
    where: { userId, groupId: { [Op.in]: groups.map((g) => g.id) } },
    attributes: ['id'],
    raw: true,
  });
  return cats.map((c) => c.id);
}

// Merges an analytics category-id filter (from resolveAnalyticsCategoryFilter) into an
// existing where object's categoryId condition, intersecting with any prior filter.
function applyAnalyticsCategoryFilter(whereTx, filter) {
  if (!filter) return;
  const ids = filter.categoryIds.length ? filter.categoryIds : [-1]; // no matches -> match nothing
  const idsCond = filter.op === 'in' ? { [Op.in]: ids } : { [Op.notIn]: ids };
  whereTx.categoryId = whereTx.categoryId !== undefined
    ? { [Op.and]: [whereTx.categoryId, idsCond] }
    : idsCond;
}

module.exports = { resolveAnalyticsCategoryFilter, applyAnalyticsCategoryFilter };
