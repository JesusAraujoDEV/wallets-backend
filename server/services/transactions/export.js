const { Op } = require('sequelize');
const { models } = require('../../libs/sequelize');

async function getTransferExportRows({ userId, fromDate, toDate, accountId, includeCommission = false, createdBy }) {
  const whereTx = { userId };
  if (fromDate || toDate) {
    whereTx.date = {};
    if (fromDate) whereTx.date[Op.gte] = fromDate;
    if (toDate) whereTx.date[Op.lte] = toDate;
  }
  if (accountId) {
    const idNum = parseInt(accountId, 10);
    if (!Number.isNaN(idNum)) whereTx.accountId = idNum;
  }

  const catWhere = includeCommission
    ? { [Op.or]: [
        { name: { [Op.iLike]: 'transferencia' } },
        { name: { [Op.iLike]: 'comision' } },
      ] }
    : { name: { [Op.iLike]: 'transferencia' } };

  const txs = await models.Transaction.findAll({
    where: whereTx,
    include: [
      { model: models.Category, attributes: ['id','name','type'], where: catWhere, required: true, paranoid: false },
      { model: models.Account, attributes: ['id','name','currency'], required: false, paranoid: false },
    ],
    order: [['date', 'ASC'], ['id', 'ASC']],
    raw: true,
    nest: true,
  });

  const rows = [];
  for (const t of txs) {
    const catName = String(t.Category?.name || '').toLowerCase();
    const catType = t.Category?.type;
    const desc = t.description || '';
    const amt = Number(t.amount || 0);
    const date = t.date;
    const accountName = t.Account?.name || '';
    const currency = t.Account?.currency || t.currency;

    if (catName === 'comision') {
      rows.push({
        id: t.id,
        date,
        from_account: accountName || null,
        to_account: null,
        currency,
        amount: amt,
        commission: amt,
        concept: desc,
        created_by: createdBy,
      });
      continue;
    }

    // Only use expense-side transfer as canonical row
    if (catType === 'gasto') {
      let toAccount = null;
      const m = desc.match(/Transferencia a ([^:]+)(?:[:]\s*(.*))?/i);
      if (m) toAccount = (m[1] || '').trim();
      rows.push({
        id: t.id,
        date,
        from_account: accountName || null,
        to_account: toAccount,
        currency,
        amount: amt,
        commission: 0,
        concept: desc,
        created_by: createdBy,
      });
    }
  }

  return rows;
}

module.exports = { getTransferExportRows };
