'use strict';
require('dotenv').config();

const isProd = (process.env.NODE_ENV || 'development') === 'production';

const base = {
  dialect: 'postgres',
};

// Detect whether we should enable SSL for DB connections.
// Enable when the DATABASE_URL contains sslmode=require or neon (Neon DB),
// or when explicitly forced via FORCE_DB_SSL=true.
const dbUrl = process.env.DATABASE_URL || '';
const forceSsl = (dbUrl && dbUrl.includes('sslmode=require')) || dbUrl.includes('neon') || (String(process.env.FORCE_DB_SSL).toLowerCase() === 'true');

const sslOptions = forceSsl ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } } : {};

module.exports = {
  development: {
    ...base,
    ...sslOptions,
    use_env_variable: 'DATABASE_URL',
  },
  test: {
    ...base,
    ...sslOptions,
    use_env_variable: 'DATABASE_URL',
  },
  production: {
    ...base,
    ...sslOptions,
    use_env_variable: 'DATABASE_URL',
  },
};
