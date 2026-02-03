'use strict';
const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(120).required(),
  name: Joi.string().min(3).max(120).optional(),
  email: Joi.string().email().max(160).required(),
  password: Joi.string().min(6).max(200).required(),
});

module.exports = { registerSchema };