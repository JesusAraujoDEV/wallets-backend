const { findOrCreateCategoryByName, findCategoryGroupIdByBehavior } = require('./category_helpers');

// Categories: Transfer out (expense), Transfer in (income), FX gain/loss (destination), Commission (expense)
async function buildTransferCategories(userId, t) {
  const excludeGroupId = await findCategoryGroupIdByBehavior(userId, 'exclude', t);
  const includeGroupId = await findCategoryGroupIdByBehavior(userId, 'include', t);

  const catOut = await findOrCreateCategoryByName(userId, 'Transferencia (Salida)', 'gasto', t, {
    icon: 'ArrowUpRight',
    color: '#f59e0b',
    colorName: 'Amber',
    groupId: excludeGroupId,
    isSystem: true,
  });
  const catIn = await findOrCreateCategoryByName(userId, 'Transferencia (Entrada)', 'ingreso', t, {
    icon: 'ArrowDownLeft',
    color: '#10b981',
    colorName: 'Emerald',
    groupId: excludeGroupId,
    isSystem: true,
  });
  const catCommission = await findOrCreateCategoryByName(userId, 'Comision', 'gasto', t, {
    icon: 'Percent',
    color: '#ef4444',
    colorName: 'Red',
    groupId: includeGroupId,
    isSystem: true,
  });
  const catFxGain = await findOrCreateCategoryByName(userId, 'Ganancia Cambiaria', 'ingreso', t, {
    icon: 'TrendingUp',
    color: '#22c55e',
    colorName: 'Green',
    groupId: excludeGroupId,
    isSystem: true,
  });
  const catFxLoss = await findOrCreateCategoryByName(userId, 'Pérdida Cambiaria', 'gasto', t, {
    icon: 'TrendingDown',
    color: '#ef4444',
    colorName: 'Red',
    groupId: excludeGroupId,
    isSystem: true,
  });

  return { catOut, catIn, catCommission, catFxGain, catFxLoss };
}

module.exports = { buildTransferCategories };
