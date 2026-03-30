const recurringTransactionService = require('../services/recurring_transaction_service');
const recurringWorkerService = require('../services/recurring_worker_service');
const { NotFoundError } = require('../utils/errors');

async function create(req, res, next) {
  try {
    const created = await recurringTransactionService.createRecurringTransaction(req.user.id, req.body);
    return res.status(201).json({ success: true, message: 'Transaccion recurrente creada', data: created });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const items = await recurringTransactionService.listRecurringTransactions(req.user.id);
    return res.json(items);
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const recurringId = parseInt(req.params.id, 10);
    const updated = await recurringTransactionService.updateRecurringTransaction(req.user.id, recurringId, req.body);
    if (!updated) throw new NotFoundError('Transaccion recurrente no encontrada.');
    return res.json({ success: true, message: 'Transaccion recurrente actualizada', data: updated });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const recurringId = parseInt(req.params.id, 10);
    const result = await recurringTransactionService.deleteRecurringTransaction(req.user.id, recurringId);
    if (!result.rowCount) throw new NotFoundError('Transaccion recurrente no encontrada.');
    return res.json({ success: true, message: 'Transaccion recurrente eliminada' });
  } catch (error) {
    return next(error);
  }
}

async function trigger(req, res, next) {
  try {
    const result = await recurringWorkerService.processDueTransactions(req.user.id);
    return res.json({
      success: true,
      processedCount: result.processedCount,
      message: 'Suscripciones procesadas',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  list,
  update,
  remove,
  trigger,
};
