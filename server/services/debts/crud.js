'use strict';

const { literal } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { NotFoundError } = require('../../utils/errors');
const { calcPaidAmount, computeStatus } = require('./shared');

async function listDebts(userId, filters = {}) {
  const where = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  const debts = await models.Debt.findAll({
    where,
    attributes: [
      'id', 'type',
      ['contact_name', 'contactName'],
      'description',
      ['total_amount', 'totalAmount'],
      'currency',
      ['due_date', 'dueDate'],
      ['category_id', 'categoryId'],
      'status',
      ['created_at', 'createdAt'],
      ['updated_at', 'updatedAt'],
      [
        literal(`(
          SELECT COALESCE(SUM(
            CASE
              WHEN "Debt".currency = 'USD' THEN
                CASE WHEN t.currency = 'USD' THEN t.amount ELSE COALESCE(t.amount_usd, 0) END
              WHEN "Debt".currency = 'VES' THEN
                CASE
                  WHEN t.currency = 'VES' THEN t.amount
                  WHEN t.currency = 'USD' THEN COALESCE(t.amount_usd, 0) * COALESCE(t.exchange_rate_used, 0)
                  ELSE 0
                END
              ELSE
                CASE WHEN t.currency = "Debt".currency THEN t.amount ELSE COALESCE(t.amount_usd, 0) END
            END
          ), 0)
          FROM transactions t
          WHERE t.debt_id = "Debt".id AND t.status = 'completed'
        )`),
        'paidAmount',
      ],
    ],
    order: [['created_at', 'DESC']],
    raw: true,
  });

  return debts.map((d) => ({
    ...d,
    totalAmount: Number(d.totalAmount),
    paidAmount: Number(d.paidAmount),
    remaining: Math.max(0, Number(d.totalAmount) - Number(d.paidAmount)),
  }));
}

async function getDebtById(userId, debtId) {
  const debt = await models.Debt.findOne({
    where: { id: debtId, userId },
  });
  if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');
  return debt;
}

async function createDebt(userId, data) {
  const debt = await models.Debt.create({
    userId,
    type: data.type,
    contactName: data.contactName,
    description: data.description || null,
    totalAmount: data.totalAmount,
    currency: data.currency || 'USD',
    dueDate: data.dueDate || null,
    categoryId: data.categoryId || null,
    status: 'pending',
  });

  return {
    id: debt.id,
    type: debt.type,
    contactName: debt.contactName,
    description: debt.description,
    totalAmount: Number(debt.totalAmount),
    currency: debt.currency,
    dueDate: debt.dueDate,
    categoryId: debt.categoryId,
    status: debt.status,
    paidAmount: 0,
    remaining: Number(debt.totalAmount),
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
  };
}

async function updateDebt(userId, debtId, data) {
  const debt = await models.Debt.findOne({ where: { id: debtId, userId } });
  if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');

  if (data.contactName !== undefined) debt.contactName = data.contactName;
  if (data.description !== undefined) debt.description = data.description;
  if (data.dueDate !== undefined) debt.dueDate = data.dueDate;
  if (data.totalAmount !== undefined) debt.totalAmount = data.totalAmount;
  if (data.categoryId !== undefined) debt.categoryId = data.categoryId;

  await debt.save();

  const paidAmount = await calcPaidAmount(debtId, debt.currency);
  const newStatus = computeStatus(Number(debt.totalAmount), paidAmount);
  if (debt.status !== newStatus) {
    debt.status = newStatus;
    await debt.save();
  }

  return {
    id: debt.id,
    type: debt.type,
    contactName: debt.contactName,
    description: debt.description,
    totalAmount: Number(debt.totalAmount),
    currency: debt.currency,
    dueDate: debt.dueDate,
    categoryId: debt.categoryId,
    status: debt.status,
    paidAmount,
    remaining: Math.max(0, Number(debt.totalAmount) - paidAmount),
    createdAt: debt.createdAt,
    updatedAt: debt.updatedAt,
  };
}

async function deleteDebt(userId, debtId) {
  const debt = await models.Debt.findOne({ where: { id: debtId, userId } });
  if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');

  await models.Transaction.update(
    { debtId: null },
    { where: { debtId: debt.id } },
  );

  await debt.destroy();
  return { rowCount: 1 };
}

module.exports = {
  listDebts,
  getDebtById,
  createDebt,
  updateDebt,
  deleteDebt,
};
