'use strict';

const Joi = require('joi');

const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('date must be in YYYY-MM-DD format');

const recurringType = Joi.string().valid('ingreso', 'gasto');
const frequency = Joi.string().valid('weekly', 'monthly', 'yearly');

const createRecurringTransactionSchema = Joi.object({
  type: recurringType.required(),
  amount: Joi.number().positive().precision(2).required(),
  description: Joi.string().min(1).max(255).required(),
  frequency: frequency.required(),
  startDate: dateOnly,
  start_date: dateOnly,
  accountId: Joi.number().integer().positive(),
  account_id: Joi.number().integer().positive(),
  categoryId: Joi.number().integer().positive(),
  category_id: Joi.number().integer().positive(),
  autoCreate: Joi.boolean(),
  auto_create: Joi.boolean(),
  isActive: Joi.boolean(),
  is_active: Joi.boolean(),
}).or('startDate', 'start_date')
  .or('accountId', 'account_id')
  .or('categoryId', 'category_id');

const updateRecurringTransactionSchema = Joi.object({
  type: recurringType,
  amount: Joi.number().positive().precision(2),
  description: Joi.string().min(1).max(255),
  frequency,
  startDate: dateOnly,
  start_date: dateOnly,
  accountId: Joi.number().integer().positive(),
  account_id: Joi.number().integer().positive(),
  categoryId: Joi.number().integer().positive(),
  category_id: Joi.number().integer().positive(),
  autoCreate: Joi.boolean(),
  auto_create: Joi.boolean(),
  isActive: Joi.boolean(),
  is_active: Joi.boolean(),
}).min(1);

const recurringTransactionIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdParamSchema,
};
