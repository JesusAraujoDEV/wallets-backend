'use strict';

const authService = require('../../services/auth_service');
const { AppError } = require('../../utils/errors');

function normalizeOriginCandidate(rawOrigin) {
  if (!rawOrigin || typeof rawOrigin !== 'string') return null;
  const sanitized = rawOrigin.replace(/\/$/, '');
  try {
    const parsed = new URL(sanitized);
    return parsed.origin;
  } catch (_error) {
    return null;
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    const allowedOrigins = (process.env.FRONTEND_URLS || '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean);

    if (!allowedOrigins.length) {
      throw new AppError('Configuración inválida: FRONTEND_URLS no está definido o está vacío.', 500);
    }

    const rawOrigin = req.headers.origin || req.headers.referer;
    const normalizedHeaderOrigin = normalizeOriginCandidate(rawOrigin);

    const clientOrigin = normalizedHeaderOrigin && allowedOrigins.includes(normalizedHeaderOrigin)
      ? normalizedHeaderOrigin
      : allowedOrigins[0];

    await authService.forgotPassword(email, clientOrigin);
    return res.json({ success: true, message: 'Solicitud de recuperación procesada.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    await authService.resetPassword(token, newPassword);
    return res.json({ success: true, message: 'Contraseña restablecida correctamente.', data: {} });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body || {};
    await authService.changePassword(userId, currentPassword, newPassword);
    return res.json({ success: true, message: 'Contraseña actualizada correctamente.', data: {} });
  } catch (error) {
    return next(error);
  }
}

module.exports = { forgotPassword, resetPassword, changePassword };
