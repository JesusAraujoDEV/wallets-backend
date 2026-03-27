const budgetService = require('../services/budget_service');

async function create(req, res, next) {
  try {
    const created = await budgetService.createBudget(req.user.id, req.body || {});
    return res.status(201).json({
      success: true,
      message: 'Presupuesto creado correctamente.',
      data: created,
    });
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const items = await budgetService.listBudgets(req.user.id, req.query || {});
    return res.json({
      success: true,
      message: 'Presupuestos obtenidos correctamente.',
      data: items,
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const budgetId = parseInt(req.params.id, 10);
    const updated = await budgetService.updateBudget(req.user.id, budgetId, req.body || {});
    return res.json({
      success: true,
      message: 'Presupuesto actualizado correctamente.',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const budgetId = parseInt(req.params.id, 10);
    await budgetService.deleteBudget(req.user.id, budgetId);
    return res.json({
      success: true,
      message: 'Presupuesto eliminado correctamente.',
      data: {},
    });
  } catch (error) {
    return next(error);
  }
}

async function status(req, res, next) {
  try {
    const items = await budgetService.getBudgetStatus(req.user.id, req.query?.month);
    return res.json({
      success: true,
      message: 'Estado de presupuestos obtenido correctamente.',
      data: items,
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
  status,
};