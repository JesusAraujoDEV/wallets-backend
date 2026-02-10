const express = require('express');
const passport = require('passport');
const telegramCtrl = require('../controllers/telegram_controller');
const { validator } = require('../middlewares/validator');
const { telegramSessionSchema } = require('../schemas/telegram.schema');
const { telegramExistsSchema, telegramGetByChatIdSchema, telegramDeleteByChatIdSchema } = require('../schemas/telegram_schema');
const { BadRequestError } = require('../utils/errors');

const router = express.Router();

router.post(
  '/link',
  passport.authenticate('jwt', { session: false }),
  (req, _res, next) => {
    if (!req.body) req.body = {};
    if (req.body.chat_id == null && req.body.chatId != null) req.body.chat_id = req.body.chatId;
    if (req.body.user_id == null && req.user?.id != null) req.body.user_id = req.user.id;
    if (req.body.user_id != null && req.user?.id != null && Number(req.body.user_id) !== Number(req.user.id)) {
      return next(new BadRequestError('user_id no coincide con el usuario autenticado.'));
    }
    return next();
  },
  validator(telegramSessionSchema),
  telegramCtrl.link,
);

router.get(
  '/exists',
  validator(telegramExistsSchema, 'query'),
  telegramCtrl.exists,
);

router.get(
  '/session',
  validator(telegramGetByChatIdSchema, 'query'),
  telegramCtrl.getByChatId,
);

router.delete(
  '/session',
  validator(telegramDeleteByChatIdSchema, 'query'),
  telegramCtrl.removeByChatId,
);

module.exports = router;
