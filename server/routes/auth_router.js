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
	updateProfileSchema,
	requestEmailChangeSchema,
	verifyOldEmailOtpSchema,
	confirmNewEmailSchema,
	unlinkGoogleSchema,
	changePasswordSchema,
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
router.patch('/me', protect, validator(updateProfileSchema), authCtrl.updateProfile);

// High-security email change flow (OTP)
router.post('/email-change/request', protect, validator(requestEmailChangeSchema), authCtrl.requestEmailChange);
router.post('/email-change/verify-old', protect, validator(verifyOldEmailOtpSchema), authCtrl.verifyOldEmailOtp);
router.post('/email-change/confirm', protect, validator(confirmNewEmailSchema), authCtrl.confirmNewEmail);

// Google account unlink flow
router.post('/unlink-google', protect, validator(unlinkGoogleSchema), authCtrl.unlinkGoogle);

// Password change for local users
router.post('/change-password', protect, validator(changePasswordSchema), authCtrl.changePassword);

// Logout (simbólico)
router.post('/logout', authCtrl.logout);

module.exports = router;
