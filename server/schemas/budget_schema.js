'use strict';
const Joi = require('joi');

const monthSchema = Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).messages({
  'string.pattern.base': 'month debe tener formato YYYY-MM.',
});

const periodSchema = Joi.string().valid('monthly');

const createBudgetSchema = Joi.object({
  categoryId: Joi.number().integer().positive().allow(null).optional(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().max(10).optional(),
  period: periodSchema.optional(),
  month: monthSchema.required(),
});

const listBudgetsQuerySchema = Joi.object({
  month: monthSchema.optional(),
  period: periodSchema.optional(),
});

const updateBudgetSchema = Joi.object({
  amount: Joi.number().positive().required(),
});

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