const authService = require('../services/auth_service');
const { AppError, BadRequestError } = require('../utils/errors');

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

async function login(req, res, next) {
  try {
    const { username, email, password } = req.body || {};
    const identifier = username || email;
    if (!identifier || !password) throw new BadRequestError('Usuario/email y contraseña requeridos.');
    const result = await authService.login(identifier, password);
    if (!result) return res.status(401).json({ ok: false, statusCode: 401, error: 'UNAUTHORIZED', message: 'Credenciales inválidas.' });
    return res.json({ ok: true, token: result.token, user: result.user });
  } catch (e) {
    return next(e);
  }
}

async function me(req, res) {
  return res.json({ ok: true, user: req.user });
}

async function logout(_req, res) {
  return res.json({ ok: true, message: 'Logout exitoso. Elimine el token en el cliente.' });
}

async function register(req, res, next) {
  try {
    const { username, email, password, name } = req.body || {};
    if (!username || !email || !password) throw new BadRequestError('username, email y password son requeridos.');
    const result = await authService.register({ username, email, password, name });
    return res.status(201).json({ ok: true, token: result.token, user: result.user });
  } catch (e) {
    return next(e);
  }
}

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
    return res.json({
      success: true,
      message: 'Solicitud de recuperación procesada.',
      data: {},
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    await authService.resetPassword(token, newPassword);
    return res.json({
      success: true,
      message: 'Contraseña restablecida correctamente.',
      data: {},
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, me, logout, register, loginGoogle, forgotPassword, resetPassword };