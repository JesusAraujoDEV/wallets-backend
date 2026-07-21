'use strict';
const Joi = require('joi');

const monthSchema = Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).messages({
  'string.pattern.base': 'month debe tener formato YYYY-MM.',
});

const specificMonthSchema = Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).messages({
  'string.pattern.base': 'specific_month debe tener formato YYYY-MM.',
});

const periodSchema = Joi.string().valid('monthly', 'yearly', 'one_time');
const rateSourceSchema = Joi.string().valid('bcv', 'binance', 'eur', 'usd').allow(null);

const createBudgetSchema = Joi.object({
  categoryId: Joi.number().integer().positive().allow(null).optional(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).optional(),
  period: periodSchema.required(),
  specific_month: Joi.when('period', {
    is: 'one_time',
    then: specificMonthSchema.required(),
    otherwise: Joi.alternatives().try(specificMonthSchema, Joi.valid(null)).optional(),
  }),
  rate_source: rateSourceSchema.optional(),
}).unknown(false);

const listBudgetsQuerySchema = Joi.object({
  month: monthSchema.optional(),
  period: periodSchema.optional(),
});

const updateBudgetSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).optional(),
  period: periodSchema.required(),
  specific_month: Joi.when('period', {
    is: 'one_time',
    then: specificMonthSchema.required(),
    otherwise: Joi.alternatives().try(specificMonthSchema, Joi.valid(null)).optional(),
  }),
  rate_source: rateSourceSchema.optional(),
}).unknown(false);

const budgetIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const budgetStatusQuerySchema = Joi.object({
  month: monthSchema.optional(),
});

module.exports = {
  createBudgetSchema,
  listBudgetsQuerySchema,
  updateBudgetSchema,
  budgetIdParamSchema,
  budgetStatusQuerySchema,
};