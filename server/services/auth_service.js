'use strict';

const { login, register } = require('./auth/credentials');
const { loginWithGoogle, unlinkGoogle } = require('./auth/google');
const { forgotPassword, resetPassword } = require('./auth/password_reset');
const { requestEmailChange, verifyOldEmailOtp, confirmNewEmail } = require('./auth/email_change');
const { updateProfile, changePassword } = require('./auth/profile');

module.exports = {
  login,
  register,
  loginWithGoogle,
  forgotPassword,
  resetPassword,
  updateProfile,
  requestEmailChange,
  verifyOldEmailOtp,
  confirmNewEmail,
  unlinkGoogle,
  changePassword,
};
