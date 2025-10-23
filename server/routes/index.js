const express = require('express');

function buildApiRouter() {
  const router = express.Router();

  // Health
  router.get('/health', (_req, res) => res.json({ ok: true }));

  // Mount resource routers (wrapping existing src routers while migrating services)
  try {
    const authRouter = require('./auth_router');
    router.use('/auth', authRouter);
  } catch {}

  try {
    const accountRouter = require('./account_router');
    router.use('/accounts', accountRouter);
  } catch {}

  try {
    const categoryRouter = require('./category_router');
    router.use('/categories', categoryRouter);
  } catch {}

  try {
    const transactionRouter = require('./transaction_router');
    router.use('/transactions', transactionRouter);
  } catch {}

  return router;
}

module.exports = { buildApiRouter };
