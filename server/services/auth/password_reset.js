'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, models } = require('../../libs/sequelize');
const { BadRequestError } = require('../../utils/errors');
const mailerService = require('../mailer_service');

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

module.exports = { forgotPassword, resetPassword };
