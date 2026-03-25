const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const categoryGroupCtrl = require('../controllers/category_group_controller');

router.use(protect);

router.get('/', categoryGroupCtrl.list);

module.exports = router;