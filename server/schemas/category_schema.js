'use strict';
const Joi = require('joi');

const type = Joi.string().valid('ingreso', 'gasto', 'income', 'expense');

const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  type: type.required(),
  groupId: Joi.number().integer().positive().required(),
  icon: Joi.string().max(60).allow('', null),
  color: Joi.string().max(32).allow('', null),
  colorName: Joi.string().max(64).allow('', null),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(120),
  type,
  groupId: Joi.number().integer().positive(),
  icon: Joi.string().max(60).allow('', null),
  color: Joi.string().max(32).allow('', null),
  colorName: Joi.string().max(64).allow('', null),
}).min(1);

const idQuerySchema = Joi.object({ id: Joi.number().integer().positive().required() });

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  idQuerySchema,
};
