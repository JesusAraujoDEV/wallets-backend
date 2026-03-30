'use strict';
const Joi = require('joi');

const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('date must be in YYYY-MM-DD format');

const currency = Joi.string().valid('VES', 'USD');

const createTransactionSchema = Joi.object({
  description: Joi.string().min(1).max(255).required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: currency.required(),
  date: dateOnly.required(),
  categoryId: Joi.number().integer().positive().required(),
  accountId: Joi.number().integer().positive().required(),
  commission: Joi.number().min(0).precision(2).optional(),
});

const transferSchema = Joi.object({
  fromAccountId: Joi.number().integer().positive().required(),
  toAccountId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required(),
  commission: Joi.number().min(0).precision(2).default(0),
  date: dateOnly.required(),
  concept: Joi.string().allow('', null).default(''),
}).custom((value, helpers) => {
  if (value.fromAccountId === value.toAccountId) {
    return helpers.error('any.invalid', { message: 'fromAccountId and toAccountId must be different' });
  }
  return value;
}, 'different accounts validation');

const confirmTransactionSchema = Joi.object({
  accountId: Joi.number().integer().positive().required(),
  date: dateOnly.optional(),
  amount: Joi.number().positive().precision(2).optional(),
  currency: Joi.string().trim().uppercase().pattern(/^[A-Z]{3}$/).optional(),
});

module.exports = { createTransactionSchema, transferSchema, confirmTransactionSchema };
