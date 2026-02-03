const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const authCtrl = require('../controllers/auth_controller');
const { validator } = require('../middlewares/validator');
const { registerSchema } = require('../schemas/auth_schema');

// Login
router.post('/login', authCtrl.login);

// Register
router.post('/register', validator(registerSchema), authCtrl.register);

// Me
router.get('/me', protect, authCtrl.me);

// Logout (simbólico)
router.post('/logout', authCtrl.logout);

module.exports = router;
