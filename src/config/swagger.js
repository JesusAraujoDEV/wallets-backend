const swaggerJsdoc = require('swagger-jsdoc');

// Compose server URLs from env so Swagger works in prod and dev
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_BASE_PATH = process.env.API_BASE_PATH || '/api';
const joinUrl = (base, path) => `${String(base).replace(/\/$/, '')}${String(path).startsWith('/') ? path : `/${path}`}`;

const servers = [];
if (process.env.BACKEND_URL) {
  servers.push({ url: joinUrl(BACKEND_URL, API_BASE_PATH), description: 'Servidor' });
}
// Always include local as a convenience
servers.push({ url: joinUrl('http://localhost:3001', API_BASE_PATH), description: 'Desarrollo local' });

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wallets API',
      version: '1.0.0',
      description: 'API para la aplicación de finanzas personales Wallets',
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.js'], // Rutas a documentar
};

const specs = swaggerJsdoc(options);

module.exports = specs;
