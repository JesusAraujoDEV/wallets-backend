const { models } = require('../libs/sequelize');
const { BadRequestError } = require('../utils/errors');

const DEFAULT_CATEGORY_GROUPS = [
  {
    name: 'Ingresos Generales',
    type: 'neutral',
    analyticsBehavior: 'include',
  },
  {
    name: 'Movimientos Internos',
    type: 'neutral',
    analyticsBehavior: 'exclude',
  },
];

const DEFAULT_CATEGORIES = [
  // --- GASTOS DEL SISTEMA ---
  {
    name: 'Ajuste de Balance (-)',
    type: 'gasto',
    isSystem: true,
    icon: 'Wrench',
    color: '#94a3b8',
    colorName: 'Slate',
    groupName: 'Movimientos Internos',
  },
  {
    name: 'Transferencia (Salida)',
    type: 'gasto',
    isSystem: true,
    icon: 'ArrowUpRight',
    color: '#f59e0b',
    colorName: 'Amber',
    groupName: 'Movimientos Internos',
  },
  {
    name: 'Comision',
    type: 'gasto',
    isSystem: true,
    icon: 'Percent',
    color: '#ef4444',
    colorName: 'Red',
    groupName: 'Ingresos Generales',
  },

  // --- INGRESOS DEL SISTEMA ---
  {
    name: 'Ajuste de Balance (+)',
    type: 'ingreso',
    isSystem: true,
    icon: 'Wrench',
    color: '#94a3b8',
    colorName: 'Slate',
    groupName: 'Movimientos Internos',
  },
  {
    name: 'Transferencia (Entrada)',
    type: 'ingreso',
    isSystem: true,
    icon: 'ArrowDownLeft',
    color: '#10b981',
    colorName: 'Emerald',
    groupName: 'Movimientos Internos',
  },
  {
    name: 'Saldo Inicial',
    type: 'ingreso',
    isSystem: true,
    icon: 'Flag',
    color: '#3b82f6',
    colorName: 'Blue',
    groupName: 'Movimientos Internos',
  },
];

function normalizeType(input) {
  if (!input) return null;
  const v = String(input).toLowerCase();
  if (v === 'ingreso' || v === 'income') return 'ingreso';
  if (v === 'gasto' || v === 'expense') return 'gasto';
  throw new BadRequestError('Tipo de categoría inválido. Use "income"/"expense" o "ingreso"/"gasto".');
}

async function list(userId) {
  const rows = await models.Category.findAll({
    attributes: ['id', 'name', 'type', 'icon', 'color', ['color_name', 'colorName'], ['is_system', 'isSystem'], ['user_id', 'userId'], ['group_id', 'groupId']],
    include: [{
      model: models.CategoryGroup,
      attributes: ['id', 'name', 'type', ['analytics_behavior', 'analyticsBehavior']],
      required: false,
    }],
    where: { userId },
    order: [['type', 'ASC'], ['name', 'ASC']],
    nest: true,
    raw: true,
  });
  return rows.map((row) => {
    const { CategoryGroup, ...rest } = row;
    return {
      ...rest,
      group: CategoryGroup || null,
    };
  });
}

async function create(userId, { name, type, groupId, icon, color, colorName }) {
  const dbType = normalizeType(type);
  let groupIdToSave = null;
  if (groupId !== undefined && groupId !== null) {
    const group = await models.CategoryGroup.findOne({ where: { id: groupId, userId } });
    if (!group) throw new BadRequestError('Grupo de categoría inválido o no pertenece al usuario.');
    groupIdToSave = group.id;
  }
  const created = await models.Category.create({ name, type: dbType, groupId: groupIdToSave, icon, color, colorName, userId });
  return { id: created.id };
}

async function update(categoryId, userId, { name, type, groupId, icon, color, colorName }) {
  const cat = await models.Category.findOne({ where: { id: categoryId, userId } });
  if (!cat) return null;
  const updates = {};
  if (typeof name === 'string') updates.name = name;
  if (typeof icon === 'string') updates.icon = icon;
  if (typeof color === 'string') updates.color = color;
  if (typeof colorName === 'string') updates.colorName = colorName;
  if (typeof type !== 'undefined' && type !== null) updates.type = normalizeType(type);
  if (groupId !== undefined && groupId !== null) {
    const group = await models.CategoryGroup.findOne({ where: { id: groupId, userId } });
    if (!group) throw new BadRequestError('Grupo de categoría inválido o no pertenece al usuario.');
    updates.groupId = group.id;
  } else if (groupId === null) {
    updates.groupId = null;
  }
  if (Object.keys(updates).length === 0) return { id: categoryId };
  await cat.update(updates);
  return { id: categoryId };
}

async function remove(categoryId, userId) {
  const count = await models.Category.destroy({ where: { id: categoryId, userId } });
  return { rowCount: count };
}

async function listFiltered(userId, { groupId, type } = {}) {
  const where = { userId };
  if (typeof groupId === 'number') where.groupId = groupId;
  if (typeof type !== 'undefined' && type !== null) where.type = normalizeType(type);
  const rows = await models.Category.findAll({
    attributes: ['id', 'name', 'type', 'icon', 'color', ['color_name', 'colorName'], ['is_system', 'isSystem'], ['user_id', 'userId'], ['group_id', 'groupId']],
    include: [{
      model: models.CategoryGroup,
      attributes: ['id', 'name', 'type', ['analytics_behavior', 'analyticsBehavior']],
      required: false,
    }],
    where,
    order: [['type', 'ASC'], ['name', 'ASC']],
    nest: true,
    raw: true,
  });
  return rows.map((row) => {
    const { CategoryGroup, ...rest } = row;
    return {
      ...rest,
      group: CategoryGroup || null,
    };
  });
}

async function createDefaultCategories(userId, transaction = null) {
  const groups = await models.CategoryGroup.bulkCreate(
    DEFAULT_CATEGORY_GROUPS.map((group) => ({ ...group, userId })),
    { transaction, returning: true },
  );

  const groupIdByName = new Map(groups.map((group) => [group.name, group.id]));
  const rows = DEFAULT_CATEGORIES.map(({ groupName, ...cat }) => ({
    ...cat,
    userId,
    groupId: groupIdByName.get(groupName) || null,
  }));
  await models.Category.bulkCreate(rows, { transaction });
}

module.exports = { list, create, update, remove, listFiltered, createDefaultCategories };
