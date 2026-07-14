const { Op } = require('sequelize');
const { models } = require('../../libs/sequelize');

// Idempotency/dedup: if an identical set was created very recently, return it instead of duplicating
async function findExistingTransferSet(t, {
  userId, fromAccount, toAccount, catOut, catIn, amt, inAmount, date,
  descOut, descIn, spreadType, spreadCategoryId, spreadDescription, spreadAbsAmount,
  comm, catCommission, descCom,
}) {
  const recentSince = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes window

  const existingOut = await models.Transaction.findOne({
    where: {
      userId,
      accountId: fromAccount.id,
      categoryId: catOut.id,
      amount: amt,
      date,
      description: descOut,
      createdAt: { [Op.gte]: recentSince },
    },
    include: [{ model: models.Category, attributes: ['type'], paranoid: false }],
    order: [['id', 'DESC']],
    transaction: t,
  });
  const existingIn = await models.Transaction.findOne({
    where: {
      userId,
      accountId: toAccount.id,
      categoryId: catIn.id,
      amount: inAmount,
      date,
      description: descIn,
      createdAt: { [Op.gte]: recentSince },
    },
    include: [{ model: models.Category, attributes: ['type'], paranoid: false }],
    order: [['id', 'DESC']],
    transaction: t,
  });
  const existingSpread = spreadType !== 'none' ? await models.Transaction.findOne({
    where: {
      userId,
      accountId: toAccount.id,
      categoryId: spreadCategoryId,
      amount: spreadAbsAmount,
      date,
      description: spreadDescription,
      createdAt: { [Op.gte]: recentSince },
    },
    include: [{ model: models.Category, attributes: ['type'], paranoid: false }],
    order: [['id', 'DESC']],
    transaction: t,
  }) : null;
  const existingCom = comm > 0 ? await models.Transaction.findOne({
    where: {
      userId,
      accountId: fromAccount.id,
      categoryId: catCommission.id,
      amount: comm,
      date,
      description: descCom,
      createdAt: { [Op.gte]: recentSince },
    },
    include: [{ model: models.Category, attributes: ['type'], paranoid: false }],
    order: [['id', 'DESC']],
    transaction: t,
  }) : null;

  return { existingOut, existingIn, existingSpread, existingCom };
}

module.exports = { findExistingTransferSet };
