const express = require('express');
const passport = require('passport');
const telegramCtrl = require('../controllers/telegram_controller');
const { validator } = require('../middlewares/validator');
const { linkTelegramSchema, telegramExistsSchema } = require('../schemas/telegram_schema');

const router = express.Router();

router.post(
  '/link',
  passport.authenticate('jwt', { session: false }),
  validator(linkTelegramSchema),
  telegramCtrl.link,
);

router.get(
  '/exists',
  validator(telegramExistsSchema, 'query'),
  telegramCtrl.exists,
);

module.exports = router;
