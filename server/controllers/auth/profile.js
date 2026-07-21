'use strict';

const authService = require('../../services/auth_service');
const { BadRequestError } = require('../../utils/errors');

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, username, email } = req.body || {};

    if (req.user.authProvider === 'google' && email !== undefined) {
      throw new BadRequestError('No puedes cambiar el correo de una cuenta vinculada a Google.');
    }

    const user = await authService.updateProfile(userId, { name, username, email });
    return res.json({ success: true, message: 'Perfil actualizado correctamente.', data: user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { updateProfile };
