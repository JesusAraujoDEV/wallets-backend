'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { models } = require('../../libs/sequelize');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../../utils/errors');

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

async function changePassword(userId, currentPassword, newPassword) {
  const user = await models.User.findByPk(userId, {
    attributes: ['id', 'authProvider', 'passwordHash'],
  });

  if (!user) throw new NotFoundError('Usuario no encontrado.');
  if (user.authProvider !== 'local') {
    throw new BadRequestError('Las cuentas vinculadas a proveedores externos no pueden cambiar contraseña con este flujo.');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new UnauthorizedError('Contraseña actual incorrecta.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({ passwordHash });
}

module.exports = { updateProfile, changePassword };
