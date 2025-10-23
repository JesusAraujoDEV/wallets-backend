const { Sequelize } = require('sequelize');
const { config } = require('../config/config');
const { setupModels } = require('../models');

const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: !config.isProd ? console.log : false,
  dialectOptions: config.isProd ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

const models = setupModels(sequelize);

module.exports = { sequelize, models };
