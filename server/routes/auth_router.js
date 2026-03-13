const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth_handler');
const authCtrl = require('../controllers/auth_controller');
const { validator } = require('../middlewares/validator');
const {
	registerSchema,
	googleLoginSchema,
	loginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} = require('../schemas/auth_schema');

// Login
router.post('/login', validator(loginSchema), authCtrl.login);

// Register
router.post('/register', validator(registerSchema), authCtrl.register);

// Google Login
router.post('/google-login', validator(googleLoginSchema), authCtrl.loginGoogle);

// Forgot password
router.post('/forgot-password', validator(forgotPasswordSchema), authCtrl.forgotPassword);

// Reset password
router.post('/reset-password', validator(resetPasswordSchema), authCtrl.resetPassword);

// Me
router.get('/me', protect, authCtrl.me);

// Logout (simbólico)
router.post('/logout', authCtrl.logout);

module.exports = router;
