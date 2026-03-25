'use strict';
const Joi = require('joi');

const type = Joi.string().valid('ingreso', 'gasto', 'neutral');
const analyticsBehavior = Joi.string().valid('include', 'exclude');

const createCategoryGroupSchema = Joi.object({
  name: Joi.string().min(1).max(120).required(),
  type: type.required(),
  analyticsBehavior,
  analytics_behavior: analyticsBehavior,
}).or('analyticsBehavior', 'analytics_behavior');

const updateCategoryGroupSchema = Joi.object({
  name: Joi.string().min(1).max(120),
  type,
  analyticsBehavior,
  analytics_behavior: analyticsBehavior,
}).min(1);

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const assignCategoriesSchema = Joi.object({
  categoryIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .unique()
    .required(),
});

module.exports = {
  createCategoryGroupSchema,
  updateCategoryGroupSchema,
  idParamSchema,
  assignCategoriesSchema,
};
