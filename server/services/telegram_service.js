const { models } = require('../libs/sequelize');

async function linkChat({ chatId, userId, username, jwtToken }) {
  await models.TelegramSession.upsert({
    chatId,
    userId,
    username: username || null,
    jwtToken,
  });

  const session = await models.TelegramSession.findByPk(chatId);
  return session ? session.toJSON() : null;
}

async function existsChat({ chatId, username }) {
  const session = await models.TelegramSession.findOne({
    where: { chatId, username },
    attributes: ['chatId'],
  });
  return !!session;
}

async function getByChatId(chatId) {
  const session = await models.TelegramSession.findByPk(chatId);
  return session ? session.toJSON() : null;
}

async function deleteByChatId(chatId) {
  const result = await models.TelegramSession.destroy({ where: { chatId } });
  return result > 0;
}

module.exports = { linkChat, existsChat, getByChatId, deleteByChatId };
