'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../../utils/errors');
const mailerService = require('../mailer_service');
const { buildOtpCode, buildOtpExpirationDate } = require('./shared');

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

module.exports = { requestEmailChange, verifyOldEmailOtp, confirmNewEmail };
