const { BadRequestError } = require('../../utils/errors');
const { toCents } = require('./shared');
const { createTransactionInT } = require('./create');

// Creates the actual transfer legs (expense/income/FX-spread/commission) once
// dedup confirmed no matching set already exists.
async function executeTransferLegs(t, userId, {
  fromAccount, toAccount, catOut, catIn, catFxGain, catFxLoss, catCommission,
  amt, inAmount, spreadType, spreadAbsAmount, comm, date,
  descOut, descIn, descFxGain, descFxLoss, descCom,
  shouldApplySpreadSplit, destinationAmt,
}) {
  const outTx = await createTransactionInT(t, userId, {
    description: descOut, amount: amt, currency: fromAccount.currency, date,
    status: 'completed', applyBalance: true, categoryId: catOut.id, accountId: fromAccount.id,
  });

  const inTx = await createTransactionInT(t, userId, {
    description: descIn, amount: inAmount, currency: toAccount.currency, date,
    status: 'completed', applyBalance: true, categoryId: catIn.id, accountId: toAccount.id,
  });

  let spreadTx = null;
  if (spreadType === 'gain') {
    spreadTx = await createTransactionInT(t, userId, {
      description: descFxGain, amount: spreadAbsAmount, currency: toAccount.currency, date,
      status: 'completed', applyBalance: true, categoryId: catFxGain.id, accountId: toAccount.id,
    });
  }
  if (spreadType === 'loss') {
    spreadTx = await createTransactionInT(t, userId, {
      description: descFxLoss, amount: spreadAbsAmount, currency: toAccount.currency, date,
      status: 'completed', applyBalance: true, categoryId: catFxLoss.id, accountId: toAccount.id,
    });
  }

  const destinationNetCents = toCents(inTx.tx.amount)
    + (spreadType === 'gain' ? toCents(spreadAbsAmount) : 0)
    - (spreadType === 'loss' ? toCents(spreadAbsAmount) : 0);
  if (shouldApplySpreadSplit && destinationNetCents !== toCents(destinationAmt)) {
    throw new BadRequestError('No fue posible cuadrar el monto final en cuenta destino exactamente con destinationAmount.');
  }

  let commissionTx = null;
  if (comm && comm > 0) {
    commissionTx = await createTransactionInT(t, userId, {
      description: descCom, amount: comm, currency: fromAccount.currency, date,
      status: 'completed', applyBalance: true, categoryId: catCommission.id, accountId: fromAccount.id,
    });
  }

  return { outTx, inTx, spreadTx, commissionTx };
}

module.exports = { executeTransferLegs };
