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
const OTP_EXPIRATION_MINUTES = 15;

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function buildOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function buildOtpExpirationDate() {
  return new Date(Date.now() + (OTP_EXPIRATION_MINUTES * 60 * 1000));
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

async function requestEmailChange(userId, currentPassword) {
  const user = await models.User.findByPk(userId, {
    attributes: ['id', 'email', 'passwordHash', 'authProvider'],
  });

  if (!user) throw new NotFoundError('Usuario no encontrado.');
  if (!user.email) throw new BadRequestError('No hay correo actual asociado a la cuenta.');

  if (user.authProvider === 'local') {
    if (!currentPassword) {
      throw new UnauthorizedError('La contraseña actual es requerida para continuar.');
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('La contraseña actual es incorrecta.');
  }

  const code = buildOtpCode();
  const expiresAt = buildOtpExpirationDate();

  await sequelize.transaction(async (t) => {
    await models.OtpCode.destroy({
      where: { userId, type: 'email_change_old' },
      transaction: t,
    });

    await models.OtpCode.create({
      userId,
      code,
      type: 'email_change_old',
      expiresAt,
    }, { transaction: t });
  });

  await mailerService.sendOtpEmail(user.email, code, 'verificación de correo actual');
}

async function verifyOldEmailOtp(userId, code, newEmail) {
  const generatedCode = buildOtpCode();
  const expiresAt = buildOtpExpirationDate();

  await sequelize.transaction(async (t) => {
    const otp = await models.OtpCode.findOne({
      where: {
        userId,
        type: 'email_change_old',
        code,
        expiresAt: { [Op.gt]: new Date() },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!otp) throw new BadRequestError('Código OTP inválido o expirado.');

    const emailInUse = await models.User.findOne({
      where: {
        id: { [Op.ne]: userId },
        email: newEmail,
      },
      attributes: ['id'],
      transaction: t,
    });

    if (emailInUse) throw new BadRequestError('El correo ya está en uso.');

    await otp.destroy({ transaction: t });

    await models.OtpCode.destroy({
      where: { userId, type: 'email_change_new' },
      transaction: t,
    });

    await models.OtpCode.create({
      userId,
      code: generatedCode,
      type: 'email_change_new',
      expiresAt,
    }, { transaction: t });
  });

  await mailerService.sendOtpEmail(newEmail, generatedCode, 'confirmación de nuevo correo');
}

async function confirmNewEmail(userId, code, newEmail) {
  const user = await sequelize.transaction(async (t) => {
    const otp = await models.OtpCode.findOne({
      where: {
        userId,
        type: 'email_change_new',
        code,
        expiresAt: { [Op.gt]: new Date() },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!otp) throw new BadRequestError('Código OTP inválido o expirado.');

    const emailInUse = await models.User.findOne({
      where: {
        id: { [Op.ne]: userId },
        email: newEmail,
      },
      attributes: ['id'],
      transaction: t,
    });

    if (emailInUse) throw new BadRequestError('El correo ya está en uso.');

    const currentUser = await models.User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'name'],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!currentUser) throw new NotFoundError('Usuario no encontrado.');

    await currentUser.update({ email: newEmail }, { transaction: t });
    await otp.destroy({ transaction: t });

    return currentUser;
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
  };
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

module.exports = {
  login,
  register,
  loginWithGoogle,
  forgotPassword,
  resetPassword,
  updateProfile,
  requestEmailChange,
  verifyOldEmailOtp,
  confirmNewEmail,
  unlinkGoogle,
};
