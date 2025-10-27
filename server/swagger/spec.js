const swaggerJsdoc = require('swagger-jsdoc');
const { config } = require('../config/config');

const servers = [
  { url: `${config.backendUrl}${config.apiBasePath}`, description: `${config.env} server` },
  { url: `http://localhost:${config.port}${config.apiBasePath}`, description: 'local dev' },
];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wallets API',
      version: '1.0.0',
    },
    servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Load JSDoc from files under server/swagger so all documentation lives in one place
  apis: ['server/swagger/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
