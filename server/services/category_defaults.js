'use strict';

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

module.exports = { DEFAULT_CATEGORY_GROUPS, DEFAULT_CATEGORIES };
