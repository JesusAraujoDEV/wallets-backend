const express = require('express');
const router = express.Router();
const statusCtrl = require('../controllers/status_controller');

// Unprotected status endpoint
router.get('/', statusCtrl.status);

module.exports = router;
