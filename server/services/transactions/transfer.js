const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');
const { getUsdRateByDate } = require('../exchange_rate_service');
const { toCents, fromCents } = require('./shared');
const { buildTransferCategories } = require('./transfer_categories');
const { buildTransferDescriptions } = require('./transfer_descriptions');
const { findExistingTransferSet } = require('./transfer_dedup');
const { executeTransferLegs } = require('./transfer_legs');
const { getHydratedTransferTransactionsInT } = require('./hydration');

function validateTransferInput({ fromId, toId, amt, date, comm, hasDestinationAmount, destinationAmt }) {
  if (!fromId || !toId || Number.isNaN(fromId) || Number.isNaN(toId)) throw new BadRequestError('Parámetros de cuentas inválidos.');
  if (fromId === toId) throw new BadRequestError('La cuenta origen y destino deben ser diferentes.');
  if (!amt || amt <= 0) throw new BadRequestError('El monto de la transferencia debe ser mayor a 0.');
  if (!date) throw new BadRequestError('La fecha es requerida.');
  if (comm < 0) throw new BadRequestError('La comisión no puede ser negativa.');
  if (hasDestinationAmount && (!Number.isFinite(destinationAmt) || destinationAmt <= 0)) {
    throw new BadRequestError('destinationAmount debe ser un número mayor a 0.');
  }
}

async function computeSpreadSplit({ isCrossCurrency, hasDestinationAmount, amt, destinationAmt, date, fromCurrency, toCurrency }) {
  const shouldApplySpreadSplit = isCrossCurrency && hasDestinationAmount;
  if (!shouldApplySpreadSplit) return { shouldApplySpreadSplit, officialBcvRate: null, expectedInAmount: null, spreadCents: 0 };

  const officialBcvRate = await getUsdRateByDate(date);
  if (!Number.isFinite(officialBcvRate) || officialBcvRate <= 0) {
    throw new BadRequestError('No se pudo obtener una tasa BCV válida para calcular la transferencia multimoneda.');
  }

  // officialBcvRate is Bs per USD. Direction depends on which side is VES:
  // VES -> USD divides by the rate, USD -> VES multiplies by it.
  const expectedAmount = fromCurrency === 'VES' ? (amt / officialBcvRate) : (amt * officialBcvRate);
  const expectedCents = toCents(expectedAmount);
  const destinationCents = toCents(destinationAmt);
  const spreadCents = destinationCents - expectedCents;
  const expectedInAmount = fromCents(expectedCents);

  if ((expectedCents + spreadCents) !== destinationCents) {
    throw new BadRequestError('No se pudo cuadrar el split cambiario al centavo con destinationAmount.');
  }

  return { shouldApplySpreadSplit, officialBcvRate, expectedInAmount, spreadCents };
}

function shapeTransferResult({ outTx, inTx, spreadTx, commissionTx, expectedAmount, spreadAmount, spreadType, officialRateUsed, hydratedData }) {
  const byId = new Map(hydratedData.map((tx) => [Number(tx.id), tx]));
  return {
    outTx: outTx ? (byId.get(Number(outTx.id)) || null) : null,
    inTx: inTx ? (byId.get(Number(inTx.id)) || null) : null,
    spreadTx: spreadTx ? (byId.get(Number(spreadTx.id)) || null) : null,
    expectedAmount,
    spreadAmount,
    spreadType,
    officialRateUsed,
    commissionTx: commissionTx ? (byId.get(Number(commissionTx.id)) || null) : null,
    data: hydratedData,
  };
}

async function createTransfer(userId, payload) {
  const { fromAccountId, toAccountId, amount, destinationAmount, commission = 0, date, concept = '' } = payload || {};
  const fromId = parseInt(fromAccountId, 10);
  const toId = parseInt(toAccountId, 10);
  const amt = Number(amount);
  const hasDestinationAmount = destinationAmount !== undefined && destinationAmount !== null && String(destinationAmount).trim() !== '';
  const destinationAmt = hasDestinationAmount ? Number(destinationAmount) : null;
  const comm = Number(commission || 0);
  validateTransferInput({ fromId, toId, amt, date, comm, hasDestinationAmount, destinationAmt });

  return await sequelize.transaction(async (t) => {
    const fromAccount = await models.Account.findOne({ where: { id: fromId, userId }, transaction: t });
    const toAccount = await models.Account.findOne({ where: { id: toId, userId }, transaction: t });
    if (!fromAccount) throw new BadRequestError('Cuenta origen no válida o no pertenece al usuario.');
    if (!toAccount) throw new BadRequestError('Cuenta destino no válida o no pertenece al usuario.');

    const isCrossCurrency = fromAccount.currency !== toAccount.currency;
    if (isCrossCurrency && !hasDestinationAmount) {
      throw new BadRequestError('destinationAmount es requerido cuando las cuentas tienen monedas distintas.');
    }

    const { shouldApplySpreadSplit, officialBcvRate, expectedInAmount, spreadCents } = await computeSpreadSplit({
      isCrossCurrency, hasDestinationAmount, amt, destinationAmt, date,
      fromCurrency: fromAccount.currency, toCurrency: toAccount.currency,
    });
    const inAmount = shouldApplySpreadSplit ? expectedInAmount : (isCrossCurrency ? destinationAmt : amt);
    const spreadType = spreadCents > 0 ? 'gain' : (spreadCents < 0 ? 'loss' : 'none');
    const spreadAbsAmount = fromCents(Math.abs(spreadCents));

    const { catOut, catIn, catCommission, catFxGain, catFxLoss } = await buildTransferCategories(userId, t);
    const { descOut, descIn, descFxGain, descFxLoss, descCom } = buildTransferDescriptions({ fromAccount, toAccount, concept });
    const spreadCategoryId = spreadType === 'gain' ? catFxGain.id : (spreadType === 'loss' ? catFxLoss.id : null);
    const spreadDescription = spreadType === 'gain' ? descFxGain : (spreadType === 'loss' ? descFxLoss : null);

    const { existingOut, existingIn, existingSpread, existingCom } = await findExistingTransferSet(t, {
      userId, fromAccount, toAccount, catOut, catIn, amt, inAmount, date,
      descOut, descIn, spreadType, spreadCategoryId, spreadDescription, spreadAbsAmount,
      comm, catCommission, descCom,
    });

    const spreadMatches = (spreadType === 'none') || !!existingSpread;
    const alreadyExists = existingOut && existingIn && spreadMatches && ((comm > 0 && existingCom) || comm === 0);

    const resultCommon = {
      expectedAmount: shouldApplySpreadSplit ? expectedInAmount : inAmount,
      spreadAmount: shouldApplySpreadSplit ? fromCents(spreadCents) : 0,
      spreadType,
      officialRateUsed: shouldApplySpreadSplit ? officialBcvRate : null,
    };

    if (alreadyExists) {
      const hydratedData = await getHydratedTransferTransactionsInT(t, userId, [existingOut.id, existingIn.id, existingSpread?.id, existingCom?.id]);
      return shapeTransferResult({ outTx: existingOut, inTx: existingIn, spreadTx: existingSpread, commissionTx: existingCom, ...resultCommon, hydratedData });
    }

    const { outTx, inTx, spreadTx, commissionTx } = await executeTransferLegs(t, userId, {
      fromAccount, toAccount, catOut, catIn, catFxGain, catFxLoss, catCommission,
      amt, inAmount, spreadType, spreadAbsAmount, comm, date,
      descOut, descIn, descFxGain, descFxLoss, descCom,
      shouldApplySpreadSplit, destinationAmt,
    });

    const hydratedData = await getHydratedTransferTransactionsInT(t, userId, [outTx.tx.id, inTx.tx.id, spreadTx?.tx?.id, commissionTx?.tx?.id]);
    return shapeTransferResult({
      outTx: outTx.tx, inTx: inTx.tx, spreadTx: spreadTx?.tx, commissionTx: commissionTx?.tx,
      ...resultCommon, hydratedData,
    });
  });
}

module.exports = { createTransfer };
