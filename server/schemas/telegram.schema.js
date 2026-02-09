'use strict';
const Joi = require('joi');

const telegramSessionSchema = Joi.object({
  chat_id: Joi.number().integer().required(),
  user_id: Joi.number().integer().required(),
});

module.exports = { telegramSessionSchema };
