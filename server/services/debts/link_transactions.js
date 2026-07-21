'use strict';

const { Op } = require('sequelize');
const { sequelize, models } = require('../../libs/sequelize');
const { NotFoundError } = require('../../utils/errors');
const { calcPaidAmount, computeStatus } = require('./shared');

async function linkTransactions(userId, debtId, data) {
  const { transactionIds } = data;

  return await sequelize.transaction(async (t) => {
    const debt = await models.Debt.findOne({
      where: { id: debtId, userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!debt) throw new NotFoundError('Deuda no encontrada o no pertenece al usuario.');

    const currentlyLinked = await models.Transaction.findAll({
      where: { debtId: debt.id, userId },
      attributes: ['id'],
      transaction: t,
      raw: true,
    });
    const currentIds = new Set(currentlyLinked.map((r) => r.id));
    const desiredIds = new Set(transactionIds);

    const toUnlink = [...currentIds].filter((id) => !desiredIds.has(id));
    if (toUnlink.length > 0) {
      await models.Transaction.update(
        { debtId: null },
        { where: { id: { [Op.in]: toUnlink }, userId }, transaction: t },
      );
    }

    const toLink = [...desiredIds].filter((id) => !currentIds.has(id));
    if (toLink.length > 0) {
      const candidates = await models.Transaction.findAll({
        where: {
          id: { [Op.in]: toLink },
          userId,
          debtId: null,
        },
        attributes: ['id'],
        transaction: t,
        raw: true,
      });
      const validNewIds = candidates.map((r) => r.id);
      if (validNewIds.length > 0) {
        await models.Transaction.update(
          { debtId: debt.id },
          { where: { id: { [Op.in]: validNewIds } }, transaction: t },
        );
      }
    }

    const paidAmount = await calcPaidAmount(debt.id, debt.currency, t);
    const newStatus = computeStatus(Number(debt.totalAmount), paidAmount);
    await debt.update({ status: newStatus }, { transaction: t });

    const finalLinked = await models.Transaction.findAll({
      where: { debtId: debt.id, userId },
      attributes: ['id'],
      transaction: t,
      raw: true,
    });

    return {
      linkedCount: finalLinked.length,
      linkedTransactionIds: finalLinked.map((r) => r.id),
      unlinkedCount: toUnlink.length,
      debt: {
        id: debt.id,
        status: newStatus,
        totalAmount: Number(debt.totalAmount),
        paidAmount,
        remaining: Math.max(0, Number(debt.totalAmount) - paidAmount),
      },
    };
  });
}

module.exports = { linkTransactions };
