const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const exchangeRateCtrl = require('../controllers/exchange_rate_controller');

router.use(protect);

router.get('/current', exchangeRateCtrl.current);
router.get('/by-date', exchangeRateCtrl.byDate);
router.get('/history', exchangeRateCtrl.history);

module.exports = router;
