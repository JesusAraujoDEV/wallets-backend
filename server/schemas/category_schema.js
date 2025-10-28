'use strict';
const Joi = require('joi');

const type = Joi.string().valid('ingreso', 'gasto', 'income', 'expense');

const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  type: type.required(),
  icon: Joi.string().max(60).allow('', null),
  color: Joi.string().max(32).allow('', null),
  colorName: Joi.string().max(64).allow('', null),
  includeInStats: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(120),
  type,
  icon: Joi.string().max(60).allow('', null),
  color: Joi.string().max(32).allow('', null),
  colorName: Joi.string().max(64).allow('', null),
  includeInStats: Joi.boolean(),
}).min(1);

const idQuerySchema = Joi.object({ id: Joi.number().integer().positive().required() });

const bulkIncludeInStatsSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  idQuerySchema,
  bulkIncludeInStatsSchema,
};
