const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const authCtrl = require('../controllers/auth_controller');

// Login
router.post('/login', authCtrl.login);

// Me
router.get('/me', protect, authCtrl.me);

// Logout (simbólico)
router.post('/logout', authCtrl.logout);

module.exports = router;
