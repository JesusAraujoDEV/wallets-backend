const { BadRequestError, NotFoundError } = require('../utils/errors');
const telegramService = require('../services/telegram_service');

async function link(req, res, next) {
  try {
    const { chat_id: chatId, user_id: userId, username } = req.body || {};

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

async function exists(req, res, next) {
  try {
    const { chatId, username } = req.query || {};
    if (!chatId || !username) throw new BadRequestError('chatId y username son requeridos.');

    const found = await telegramService.existsChat({
      chatId: Number(chatId),
      username,
    });

    return res.json({ ok: true, exists: found });
  } catch (e) {
    return next(e);
  }
}

async function getByChatId(req, res, next) {
  try {
    const { chatId } = req.query || {};
    if (!chatId) throw new BadRequestError('chatId es requerido.');

    const session = await telegramService.getByChatId(Number(chatId));
    if (!session) throw new NotFoundError('Sesión de Telegram no encontrada.');

    return res.json({ ok: true, session });
  } catch (e) {
    return next(e);
  }
}

async function removeByChatId(req, res, next) {
  try {
    const { chatId } = req.query || {};
    if (!chatId) throw new BadRequestError('chatId es requerido.');

    const deleted = await telegramService.deleteByChatId(Number(chatId));
    if (!deleted) throw new NotFoundError('Sesión de Telegram no encontrada.');

    return res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
}

module.exports = { link, exists, getByChatId, removeByChatId };
