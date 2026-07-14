const { sequelize, models } = require('../../libs/sequelize');

async function deleteTransaction(txId, userId) {
  return await sequelize.transaction(async (t) => {
    const oldTx = await models.Transaction.findOne({ where: { id: txId, userId }, transaction: t });
    if (!oldTx) return { rowCount: 0 };

    const oldCategoryType = (await models.Category.findByPk(oldTx.categoryId, { transaction: t }))?.type;
    const account = await models.Account.findOne({ where: { id: oldTx.accountId, userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (oldTx.status === 'completed' && account) {
      const oldDelta = oldCategoryType === 'ingreso' ? -Number(oldTx.amount) : Number(oldTx.amount);
      await account.update({ balance: Number(account.balance) + oldDelta }, { transaction: t });
    }

    // Hard delete by design (DA decision): transactions are deferred to soft-delete
    // iteration 2 — restoring one would need to re-apply the balance delta above.
    await oldTx.destroy({ transaction: t });
    return { rowCount: 1 };
  });
}

module.exports = { deleteTransaction };
