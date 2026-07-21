'use strict';

const authService = require('../../services/auth_service');
const { BadRequestError } = require('../../utils/errors');

async function loginGoogle(req, res, next) {
  try {
    const { token } = req.body || {};
    if (!token) throw new BadRequestError('El token de Google es requerido');
    const result = await authService.loginWithGoogle(token);
    return res.json({ ok: true, token: result.token, user: result.user });
  } catch (e) {
    return next(e);
  }
}

async function unlinkGoogle(req, res, next) {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body || {};
    const user = await authService.unlinkGoogle(userId, newPassword);
    return res.json({ success: true, message: 'Cuenta de Google desvinculada correctamente.', data: user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { loginGoogle, unlinkGoogle };
