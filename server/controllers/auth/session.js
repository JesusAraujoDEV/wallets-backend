'use strict';

const authService = require('../../services/auth_service');
const { BadRequestError } = require('../../utils/errors');

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

module.exports = { login, me, logout, register };
