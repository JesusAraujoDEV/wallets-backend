const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const net = require('net');

const { config } = require('./config/config');
const { sequelize } = require('./libs/sequelize');
const { buildApiRouter } = require('./routes');
const { swaggerSpec } = require('./swagger/spec');
const { logErrors, boomErrorHandler, ormErrorHandler, errorHandler } = require('./middlewares/error_handler');
const { protect } = require('./middlewares/auth_handler');

async function findAvailablePort(startPort, maxTries = 5) {
  function tryPort(port) {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(null))
        .once('listening', () => tester.close(() => resolve(port)))
        .listen(port);
    });
  }
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    // eslint-disable-next-line no-await-in-loop
    const available = await tryPort(port);
    if (available) return available;
  }
  return startPort; // fallback to requested if none found
}

async function bootstrap() {
  const app = express();

  // CORS with whitelist
  const whitelist = new Set(config.corsWhitelist.map(o => o.toLowerCase()));
  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.toLowerCase();
      if (whitelist.has(normalized)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

  app.use(express.json());
  app.use(cookieParser());

  // Static uploads
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // API
  app.use(config.apiBasePath, buildApiRouter());

  // Error handlers
  app.use(logErrors);
  app.use(ormErrorHandler);
  app.use(boomErrorHandler);
  app.use(errorHandler);

  // DB connect check
  try {
    await sequelize.authenticate();
    console.log('Sequelize connected');
  } catch (e) {
    console.error('Sequelize connection error', e.message);
  }

  const port = await findAvailablePort(config.port);
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

// Start only if run directly
if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };
