'use strict';

const Joi = require('joi');

const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).message('date must be in YYYY-MM-DD format');

const recurringType = Joi.string().valid('ingreso', 'gasto');
const frequency = Joi.string().valid('weekly', 'monthly', 'yearly');
const executionMode = Joi.string().valid('auto', 'manual');
const currencyCode = Joi.string().trim().uppercase().pattern(/^[A-Z]{3}$/);
const nullableAccount = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.valid(null),
  Joi.string().trim().valid('')
);

const createRecurringTransactionSchema = Joi.object({
  type: recurringType.required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: currencyCode.required(),
  description: Joi.string().min(1).max(255).required(),
  frequency: frequency.required(),
  startDate: dateOnly,
  start_date: dateOnly,
  accountId: nullableAccount,
  account_id: nullableAccount,
  categoryId: Joi.number().integer().positive(),
  category_id: Joi.number().integer().positive(),
  executionMode,
  execution_mode: executionMode,
  isActive: Joi.boolean(),
  is_active: Joi.boolean(),
}).or('startDate', 'start_date')
  .or('categoryId', 'category_id');

const updateRecurringTransactionSchema = Joi.object({
  type: recurringType,
  amount: Joi.number().positive().precision(2),
  currency: currencyCode,
  description: Joi.string().min(1).max(255),
  frequency,
  startDate: dateOnly,
  start_date: dateOnly,
  accountId: nullableAccount,
  account_id: nullableAccount,
  categoryId: Joi.number().integer().positive(),
  category_id: Joi.number().integer().positive(),
  executionMode,
  execution_mode: executionMode,
  isActive: Joi.boolean(),
  is_active: Joi.boolean(),
}).min(1);

const recurringTransactionIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const payNowSchema = Joi.object({
  date: dateOnly.optional(),
  accountId: Joi.number().integer().positive(),
  account_id: Joi.number().integer().positive(),
  amount: Joi.number().positive().precision(2),
  currency: currencyCode,
}).or('accountId', 'account_id');

module.exports = {
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  recurringTransactionIdParamSchema,
  payNowSchema,
};
