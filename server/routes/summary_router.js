const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const summaryCtrl = require('../controllers/summary_controller');

router.use(protect);

// GET /summary/balance
router.get('/balance', summaryCtrl.balance);

// GET /summary/income
router.get('/income', summaryCtrl.income);

// GET /summary/expense
router.get('/expense', summaryCtrl.expense);

module.exports = router;
