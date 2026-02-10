'use strict';
const Joi = require('joi');

const linkTelegramSchema = Joi.object({
  chatId: Joi.number().integer().required(),
  username: Joi.string().max(100).optional(),
});

const telegramExistsSchema = Joi.object({
  chatId: Joi.number().integer().required(),
  username: Joi.string().max(100).required(),
});

const telegramGetByChatIdSchema = Joi.object({
  chatId: Joi.number().integer().required(),
});

module.exports = { linkTelegramSchema, telegramExistsSchema, telegramGetByChatIdSchema };
