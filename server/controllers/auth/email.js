'use strict';

const authService = require('../../services/auth_service');

async function requestEmailChange(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword } = req.body || {};
    await authService.requestEmailChange(userId, currentPassword);
    return res.json({ success: true, message: 'Código OTP enviado al correo actual.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function verifyOldEmailOtp(req, res, next) {
  try {
    const userId = req.user.id;
    const { code, newEmail } = req.body || {};
    await authService.verifyOldEmailOtp(userId, code, newEmail);
    return res.json({ success: true, message: 'Código OTP enviado al nuevo correo.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function confirmNewEmail(req, res, next) {
  try {
    const userId = req.user.id;
    const { code, newEmail } = req.body || {};
    const user = await authService.confirmNewEmail(userId, code, newEmail);
    return res.json({ success: true, message: 'Correo actualizado correctamente.', data: user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { requestEmailChange, verifyOldEmailOtp, confirmNewEmail };
