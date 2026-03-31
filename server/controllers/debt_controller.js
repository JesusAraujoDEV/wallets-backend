const debtService = require('../services/debt_service');

async function list(req, res, next) {
  try {
    const items = await debtService.listDebts(req.user.id, req.query || {});
    return res.json({ success: true, message: 'Deudas obtenidas correctamente.', data: items });
  } catch (e) { return next(e); }
}

async function create(req, res, next) {
  try {
    const debt = await debtService.createDebt(req.user.id, req.body);
    return res.status(201).json({ success: true, message: 'Deuda creada correctamente.', data: debt });
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const debtId = parseInt(req.params.id, 10);
    const debt = await debtService.updateDebt(req.user.id, debtId, req.body);
    return res.json({ success: true, message: 'Deuda actualizada correctamente.', data: debt });
  } catch (e) { return next(e); }
}

async function remove(req, res, next) {
  try {
    const debtId = parseInt(req.params.id, 10);
    await debtService.deleteDebt(req.user.id, debtId);
    return res.json({ success: true, message: 'Deuda eliminada correctamente.', data: {} });
  } catch (e) { return next(e); }
}

async function pay(req, res, next) {
  try {
    const debtId = parseInt(req.params.id, 10);
    const result = await debtService.payDebt(req.user.id, debtId, req.body);
    return res.status(201).json({ success: true, message: 'Abono registrado correctamente.', data: result });
  } catch (e) { return next(e); }
}

async function linkTransactions(req, res, next) {
  try {
    const debtId = parseInt(req.params.id, 10);
    const result = await debtService.linkTransactions(req.user.id, debtId, req.body);
    return res.json({ success: true, message: 'Transacciones vinculadas correctamente.', data: result });
  } catch (e) { return next(e); }
}

module.exports = { list, create, update, remove, pay, linkTransactions };
