const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const authCtrl = require('../controllers/auth_controller');
const { validator } = require('../middlewares/validator');
const { registerSchema, googleLoginSchema } = require('../schemas/auth_schema');

// Login
router.post('/login', authCtrl.login);

// Register
router.post('/register', validator(registerSchema), authCtrl.register);

// Google Login
router.post('/google-login', validator(googleLoginSchema), authCtrl.loginGoogle);

// Me
router.get('/me', protect, authCtrl.me);

// Logout (simbólico)
router.post('/logout', authCtrl.logout);

module.exports = router;
