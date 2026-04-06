const Joi = require('joi');

const agendaForecastQuerySchema = Joi.object({}).unknown(false);

module.exports = {
  agendaForecastQuerySchema,
};
