'use strict';
const Joi = require('joi');

const currency = Joi.string().valid('VES', 'USD');

const createAccountSchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  type: Joi.string().min(1).max(50).default('efectivo'),
  currency: currency.required(),
  balance: Joi.number().precision(2).default(0),
});

const updateAccountSchema = Joi.object({
  name: Joi.string().min(1).max(120).optional(),
  currency: currency.optional(),
  balance: Joi.number().precision(2).optional(),
}).min(1);

const idQuerySchema = Joi.object({ id: Joi.number().integer().positive().required() });

module.exports = {
  createAccountSchema,
  updateAccountSchema,
  idQuerySchema,
};
