const express = require('express');
const router = express.Router();
const { getAccounts, createAccount, updateAccount, deleteAccount } = require('../controllers/accountController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(getAccounts)
    .post(createAccount);

router.route('/')
    .put(updateAccount)
    .delete(deleteAccount);

module.exports = router;
