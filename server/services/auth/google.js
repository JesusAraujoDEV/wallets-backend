'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { sequelize, models } = require('../../libs/sequelize');
const { UnauthorizedError, BadRequestError, NotFoundError } = require('../../utils/errors');
const categoryService = require('../category_service');
const { buildUniqueUsername } = require('./credentials');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function loginWithGoogle(token) {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    throw new UnauthorizedError('El token de Google no es válido o ha expirado.', error?.message);
  }

  const payload = ticket.getPayload();
  const { email, name, sub } = payload || {};
  if (!email) throw new UnauthorizedError('El token de Google no contiene email válido.');
  if (!sub) throw new UnauthorizedError('El token de Google no contiene identificador de proveedor válido.');

  let user = await models.User.findOne({
    where: { email },
    attributes: ['id', 'username', 'email', 'name', 'passwordHash'],
  });

  if (!user) {
    const baseUsername = email.split('@')[0];
    const username = await buildUniqueUsername(baseUsername);
    const randomPassword = `${Math.random().toString(36).slice(-8)}${Math.random().toString(36).slice(-8)}`;
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    user = await sequelize.transaction(async (t) => {
      const created = await models.User.create({
        email,
        name: name || null,
        username,
        passwordHash,
        authProvider: 'google',
        authProviderId: sub,
      }, { transaction: t });

      await models.Account.create({
        name: 'Efectivo',
        type: 'efectivo',
        currency: 'USD',
        balance: 0,
        userId: created.id,
      }, { transaction: t });

      await categoryService.createDefaultCategories(created.id, t);

      return created;
    });
  }

  const payloadJwt = {
    id: user.id,
    username: user.username,
    email: user.email,
  };
  const myToken = jwt.sign(payloadJwt, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const userData = user.toJSON();
  delete userData.passwordHash;
  return { token: myToken, user: userData };
}

async function unlinkGoogle(userId, newPassword) {
  const user = await models.User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'name', 'authProvider', 'authProviderId'],
  });

  if (!user) throw new NotFoundError('Usuario no encontrado.');
  if (user.authProvider !== 'google') {
    throw new BadRequestError('Solo las cuentas vinculadas a Google pueden desvincularse con este flujo.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({
    passwordHash,
    authProvider: 'local',
    authProviderId: null,
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    authProvider: user.authProvider,
    authProviderId: user.authProviderId,
  };
}

module.exports = { loginWithGoogle, unlinkGoogle };
