const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const { sequelize, models } = require('../libs/sequelize');
const { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const categoryService = require('./category_service');
const mailerService = require('./mailer_service');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

async function buildUniqueUsername(base) {
  const normalized = (base || 'user').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 100) || 'user';
  let candidate = normalized;
  let suffix = 0;
  while (await models.User.findOne({ where: { username: candidate }, attributes: ['id'] })) {
    suffix += 1;
    candidate = `${normalized}${suffix}`.slice(0, 120);
  }
  return candidate;
}

async function login(username, password) {
  const user = await models.User.findOne({
    where: {
      [Op.or]: [
        { username },
        { email: username },
      ],
    },
    attributes: ['id', 'username', 'email', 'name', 'passwordHash'],
  });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return {
    token: generateToken(user.id),
    user: { id: user.id, username: user.username, email: user.email, name: user.name },
  };
}

async function register({ username, email, password, name }) {
  const existing = await models.User.findOne({
    where: {
      [Op.or]: [
        { username },
        { email },
      ],
    },
  });
  if (existing) throw new ConflictError('El usuario o email ya existe.');

  const passwordHash = await bcrypt.hash(password, 10);

  return await sequelize.transaction(async (t) => {
    const created = await models.User.create({
      username,
      email,
      name: name || null,
      passwordHash,
    }, { transaction: t });

    // Onboarding: create default cash wallet
    await models.Account.create({
      name: 'Efectivo',
      type: 'efectivo',
      currency: 'USD',
      balance: 0,
      userId: created.id,
    }, { transaction: t });

    await categoryService.createDefaultCategories(created.id, t);

    return {
      token: generateToken(created.id),
      user: { id: created.id, username: created.username, email: created.email, name: created.name },
    };
  });
}

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
    id: user.id,      // <--- ¡AHORA SÍ! ✅ (Igual que el token de Postman)
    username: user.username, // (Opcional, pero útil pal frontend)
    email: user.email        // (Opcional)
  };
  const myToken = jwt.sign(payloadJwt, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const userData = user.toJSON();
  delete userData.passwordHash;
  return { token: myToken, user: userData };
}

async function forgotPassword(email, clientOrigin) {
  const user = await models.User.findOne({
    where: { email },
    attributes: ['id', 'email'],
  });

  if (!user) {
    throw new BadRequestError('No se pudo procesar la solicitud de recuperación.');
  }

  const token = crypto.randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + (60 * 60 * 1000));

  await sequelize.transaction(async (t) => {
    await user.update({
      resetPasswordToken: token,
      resetPasswordExpires: expiresAt,
    }, { transaction: t });
  });

  await mailerService.sendPasswordResetEmail(user.email, token, clientOrigin);
}

async function resetPassword(token, newPassword) {
  const user = await models.User.findOne({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { [Op.gt]: new Date() },
    },
    attributes: ['id', 'passwordHash', 'resetPasswordToken', 'resetPasswordExpires'],
  });

  if (!user) {
    throw new BadRequestError('El token de restablecimiento es inválido o expiró.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await sequelize.transaction(async (t) => {
    await user.update({
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    }, { transaction: t });
  });
}

async function updateProfile(userId, updateData) {
  const currentUser = await models.User.findByPk(userId, {
    attributes: ['id', 'authProvider'],
  });

  if (!currentUser) throw new NotFoundError('Usuario no encontrado.');

  const payload = {};
  const allowedFields = ['name', 'username', 'email'];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) payload[field] = updateData[field];
  });

  if (!Object.keys(payload).length) {
    throw new BadRequestError('Debe enviar al menos un campo para actualizar.');
  }

  if (currentUser.authProvider === 'google' && payload.email !== undefined) {
    throw new BadRequestError('No puedes cambiar el correo de una cuenta vinculada a Google.');
  }

  if (payload.email || payload.username) {
    const uniqueChecks = [];
    if (payload.email) uniqueChecks.push({ email: payload.email });
    if (payload.username) uniqueChecks.push({ username: payload.username });

    const existingUser = await models.User.findOne({
      where: {
        id: { [Op.ne]: userId },
        [Op.or]: uniqueChecks,
      },
      attributes: ['id', 'username', 'email'],
    });

    if (existingUser) {
      if (payload.email && existingUser.email === payload.email) {
        throw new BadRequestError('El correo ya está en uso.');
      }
      if (payload.username && existingUser.username === payload.username) {
        throw new BadRequestError('El usuario ya está en uso.');
      }
      throw new BadRequestError('El correo o usuario ya está en uso.');
    }
  }

  const [, updatedUsers] = await models.User.update(payload, {
    where: { id: userId },
    fields: Object.keys(payload),
    returning: true,
  });

  const updatedUser = updatedUsers[0];
  if (!updatedUser) throw new NotFoundError('Usuario no encontrado.');

  return {
    id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    name: updatedUser.name,
  };
}

module.exports = { login, register, loginWithGoogle, forgotPassword, resetPassword, updateProfile };
