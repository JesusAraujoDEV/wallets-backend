'use strict';
const Joi = require('joi');

const dateOnly = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  'string.pattern.base': 'date must be in YYYY-MM-DD format',
});

const createDebtSchema = Joi.object({
  type: Joi.string().valid('payable', 'receivable').required(),
  contactName: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(255).allow('', null).optional(),
  totalAmount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().max(10).default('USD'),
  dueDate: dateOnly.allow(null).optional(),
  categoryId: Joi.number().integer().positive().allow(null).optional(),
}).unknown(false);

const updateDebtSchema = Joi.object({
  contactName: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(255).allow('', null).optional(),
  dueDate: dateOnly.allow(null).optional(),
  totalAmount: Joi.number().positive().precision(2).optional(),
  categoryId: Joi.number().integer().positive().allow(null).optional(),
}).unknown(false).min(1);

const debtIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const payDebtSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().max(10).required(),
  accountId: Joi.number().integer().positive().required(),
  date: dateOnly.required(),
  categoryId: Joi.number().integer().positive().optional(),
}).unknown(false);

const listDebtsQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'partial', 'paid').optional(),
  type: Joi.string().valid('payable', 'receivable').optional(),
});

const linkTransactionsSchema = Joi.object({
  transactionIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(100)
    .required(),
}).unknown(false);

module.exports = {
  createDebtSchema,
  updateDebtSchema,
  debtIdParamSchema,
  payDebtSchema,
  listDebtsQuerySchema,
  linkTransactionsSchema,
};
