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

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, username, email } = req.body || {};

    if (req.user.authProvider === 'google' && email !== undefined) {
      throw new BadRequestError('No puedes cambiar el correo de una cuenta vinculada a Google.');
    }

    const user = await authService.updateProfile(userId, { name, username, email });
    return res.json({
      success: true,
      message: 'Perfil actualizado correctamente.',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
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

async function requestEmailChange(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword } = req.body || {};

    await authService.requestEmailChange(userId, currentPassword);
    return res.json({
      success: true,
      message: 'Código OTP enviado al correo actual.',
      data: {},
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyOldEmailOtp(req, res, next) {
  try {
    const userId = req.user.id;
    const { code, newEmail } = req.body || {};

    await authService.verifyOldEmailOtp(userId, code, newEmail);
    return res.json({
      success: true,
      message: 'Código OTP enviado al nuevo correo.',
      data: {},
    });
  } catch (error) {
    return next(error);
  }
}

async function confirmNewEmail(req, res, next) {
  try {
    const userId = req.user.id;
    const { code, newEmail } = req.body || {};

    const user = await authService.confirmNewEmail(userId, code, newEmail);
    return res.json({
      success: true,
      message: 'Correo actualizado correctamente.',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

async function unlinkGoogle(req, res, next) {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body || {};

    const user = await authService.unlinkGoogle(userId, newPassword);
    return res.json({
      success: true,
      message: 'Cuenta de Google desvinculada correctamente.',
      data: user,
    });
  } catch (error) {
    return next(error);
  }
}

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
};