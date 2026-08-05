'use strict';
const Joi = require('joi');

const createTagSchema = Joi.object({
  name: Joi.string().min(1).max(60).required(),
  color: Joi.string().max(20).allow('', null).optional(),
  icon: Joi.string().max(40).allow('', null).optional(),
});

const updateTagSchema = Joi.object({
  name: Joi.string().min(1).max(60).optional(),
  color: Joi.string().max(20).allow('', null).optional(),
  icon: Joi.string().max(40).allow('', null).optional(),
}).min(1);

const tagIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const assignTagsSchema = Joi.object({
  tagIds: Joi.array().items(Joi.number().integer().positive()).min(1).max(20).required(),
});

module.exports = { createTagSchema, updateTagSchema, tagIdParamSchema, assignTagsSchema };
