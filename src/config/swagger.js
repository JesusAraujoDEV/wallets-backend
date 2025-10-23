const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wallets API',
      version: '1.0.0',
      description: 'API para la aplicación de finanzas personales Wallets',
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Servidor de Desarrollo'
      },
    ],
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
