require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

const config = {
  env,
  isProd,
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  backendUrl: process.env.BACKEND_URL || `http://localhost:${Number(process.env.PORT) || 3000}`,
  apiBasePath: process.env.API_BASE_PATH || '/api',
  corsWhitelist: (process.env.FRONTEND_URLS || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean),
};

module.exports = { config };
