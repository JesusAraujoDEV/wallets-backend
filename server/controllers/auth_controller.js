'use strict';

const { login, me, logout, register } = require('./auth/session');
const { loginGoogle, unlinkGoogle } = require('./auth/google');
const { forgotPassword, resetPassword, changePassword } = require('./auth/password');
const { requestEmailChange, verifyOldEmailOtp, confirmNewEmail } = require('./auth/email');
const { updateProfile } = require('./auth/profile');

module.exports = {
  login,
  me,
  updateProfile,
  logout,
  register,
  loginGoogle,
  forgotPassword,
  resetPassword,
  requestEmailChange,
  verifyOldEmailOtp,
  confirmNewEmail,
  unlinkGoogle,
  changePassword,
};
