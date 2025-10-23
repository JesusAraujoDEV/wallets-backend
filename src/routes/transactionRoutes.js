const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(getTransactions)
    .post(createTransaction);

router.route('/')
    .put(updateTransaction)
    delete(deleteTransaction);

module.exports = router;
