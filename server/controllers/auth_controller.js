const authService = require('../services/auth_service');
const { BadRequestError } = require('../utils/errors');

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) throw new BadRequestError('Usuario y contraseña requeridos.');
    const result = await authService.login(username, password);
    if (!result) return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
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

module.exports = { login, me, logout };