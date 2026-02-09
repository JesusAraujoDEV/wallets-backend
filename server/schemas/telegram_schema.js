'use strict';
const Joi = require('joi');

const linkTelegramSchema = Joi.object({
  chatId: Joi.number().integer().required(),
  username: Joi.string().max(100).optional(),
});

module.exports = { linkTelegramSchema };
