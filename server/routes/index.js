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
    const transactionRouter = require('./transaction_router');
    router.use('/transactions', transactionRouter);
  } catch (e) { console.error('Failed to mount /transactions router:', e.message); }

  return router;
}

module.exports = { buildApiRouter };
