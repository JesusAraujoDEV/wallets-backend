const { models } = require('../libs/sequelize');
const { NotFoundError, BadRequestError } = require('../utils/errors');

async function list(userId) {
  return await models.Tag.findAll({
    where: { userId },
    order: [['name', 'ASC']],
    attributes: ['id', 'name', 'color', 'icon'],
  });
}

async function create(userId, data) {
  const existing = await models.Tag.findOne({
    where: { userId, name: data.name },
  });
  if (existing) throw new BadRequestError(`Ya existe un tag con el nombre "${data.name}".`);

  return await models.Tag.create({ ...data, userId });
}

async function update(id, userId, data) {
  const tag = await models.Tag.findOne({ where: { id, userId } });
  if (!tag) throw new NotFoundError('Tag no encontrado.');

  if (data.name && data.name !== tag.name) {
    const dup = await models.Tag.findOne({ where: { userId, name: data.name } });
    if (dup) throw new BadRequestError(`Ya existe un tag con el nombre "${data.name}".`);
  }

  await tag.update(data);
  return tag;
}

async function remove(id, userId) {
  const tag = await models.Tag.findOne({ where: { id, userId } });
  if (!tag) throw new NotFoundError('Tag no encontrado.');
  await models.TransactionTag.destroy({ where: { tagId: id } });
  await tag.destroy();
  return { ok: true };
}

async function assignTagsToTransaction(transactionId, userId, tagIds) {
  const tx = await models.Transaction.findOne({ where: { id: transactionId, userId } });
  if (!tx) throw new NotFoundError('Transacción no encontrada.');

  const tags = await models.Tag.findAll({ where: { id: tagIds, userId } });
  if (tags.length !== tagIds.length) {
    throw new BadRequestError('Uno o más tags no pertenecen al usuario.');
  }

  // Remove existing and set new
  await models.TransactionTag.destroy({ where: { transactionId } });
  const rows = tagIds.map(tagId => ({ transactionId, tagId }));
  await models.TransactionTag.bulkCreate(rows, { ignoreDuplicates: true });

  return tags.map(t => ({ id: t.id, name: t.name, color: t.color, icon: t.icon }));
}

async function getTagsForTransaction(transactionId, userId) {
  const tx = await models.Transaction.findOne({ where: { id: transactionId, userId } });
  if (!tx) throw new NotFoundError('Transacción no encontrada.');

  const links = await models.TransactionTag.findAll({ where: { transactionId } });
  if (!links.length) return [];

  const tagIds = links.map(l => l.tagId);
  return await models.Tag.findAll({
    where: { id: tagIds },
    attributes: ['id', 'name', 'color', 'icon'],
  });
}

async function getTransactionsByTag(tagId, userId) {
  const tag = await models.Tag.findOne({ where: { id: tagId, userId } });
  if (!tag) throw new NotFoundError('Tag no encontrado.');

  const links = await models.TransactionTag.findAll({ where: { tagId } });
  if (!links.length) return { tag, transactions: [] };

  const txIds = links.map(l => l.transactionId);
  const transactions = await models.Transaction.findAll({
    where: { id: txIds, userId },
    include: [{ model: models.Category, attributes: ['type', 'name'] }],
    order: [['date', 'DESC'], ['id', 'DESC']],
  });

  return {
    tag: { id: tag.id, name: tag.name, color: tag.color, icon: tag.icon },
    transactions: transactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      currency: t.currency,
      amountUsd: t.amountUsd,
      date: t.date,
      type: t.Category?.type,
      categoryName: t.Category?.name,
    })),
  };
}

module.exports = { list, create, update, remove, assignTagsToTransaction, getTagsForTransaction, getTransactionsByTag };
