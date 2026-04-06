const express = require('express');

function buildApiRouter() {
  const router = express.Router();

  // Health
  router.get('/health', (_req, res) => res.json({ ok: true }));

  // Mount resource routers (wrapping existing src routers while migrating services)
  try {
    const authRouter = require('./auth_router');
    router.use('/auth', authRouter);
  } catch (e) { console.error('Failed to mount /auth router:', e.message); }

  try {
    const accountRouter = require('./account_router');
    router.use('/accounts', accountRouter);
  } catch (e) { console.error('Failed to mount /accounts router:', e.message); }

  try {
    const categoryRouter = require('./category_router');
    router.use('/categories', categoryRouter);
  } catch (e) { console.error('Failed to mount /categories router:', e.message); }

  try {
    const categoryGroupRouter = require('./category_group_router');
    router.use('/category-groups', categoryGroupRouter);
  } catch (e) { console.error('Failed to mount /category-groups router:', e.message); }

  try {
    const transactionRouter = require('./transaction_router');
    router.use('/transactions', transactionRouter);
  } catch (e) { console.error('Failed to mount /transactions router:', e.message); }

  try {
    const recurringTransactionRouter = require('./recurring_transaction_router');
    router.use('/recurring-transactions', recurringTransactionRouter);
  } catch (e) { console.error('Failed to mount /recurring-transactions router:', e.message); }

  try {
    const summaryRouter = require('./summary_router');
    router.use('/summary', summaryRouter);
  } catch (e) { console.error('Failed to mount /summary router:', e.message); }

  try {
    const statusRouter = require('./status_router');
    router.use('/status', statusRouter);
  } catch (e) { console.error('Failed to mount /status router:', e.message); }

  try {
    const statsRouter = require('./stats_router');
    router.use('/stats', statsRouter);
  } catch (e) { console.error('Failed to mount /stats router:', e.message); }

  try {
    const budgetRouter = require('./budget_router');
    router.use('/budgets', budgetRouter);
  } catch (e) { console.error('Failed to mount /budgets router:', e.message); }

  try {
    const debtRouter = require('./debt_router');
    router.use('/debts', debtRouter);
  } catch (e) { console.error('Failed to mount /debts router:', e.message); }

  try {
    const agendaRouter = require('./agenda_router');
    router.use('/agenda', agendaRouter);
  } catch (e) { console.error('Failed to mount /agenda router:', e.message); }

  try {
    const telegramRouter = require('./telegram_router');
    router.use('/telegram', telegramRouter);
  } catch (e) { console.error('Failed to mount /telegram router:', e.message); }

  return router;
}

module.exports = { buildApiRouter };
