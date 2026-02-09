const { BadRequestError } = require('../utils/errors');
const telegramService = require('../services/telegram_service');

async function link(req, res, next) {
  try {
    const { chatId, username } = req.body || {};
    const userId = req.user?.id;

    if (!userId) throw new BadRequestError('Usuario autenticado requerido.');
    if (!chatId) throw new BadRequestError('chatId es requerido.');

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) throw new BadRequestError('Authorization token requerido.');

    const session = await telegramService.linkChat({
      chatId,
      userId,
      username,
      jwtToken: token,
    });

    return res.status(201).json({ ok: true, session });
  } catch (e) {
    return next(e);
  }
}

module.exports = { link };
