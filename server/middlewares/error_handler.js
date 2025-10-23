const boom = require('@hapi/boom');

function logErrors(err, _req, _res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  next(err);
}

function boomErrorHandler(err, _req, res, next) {
  if (boom.isBoom(err)) {
    const { output } = err;
    return res.status(output.statusCode).json(output.payload);
  }
  next(err);
}

function ormErrorHandler(err, _req, res, next) {
  // Basic Sequelize error normalization; extend as needed
  if (err && err.name && err.name.includes('Sequelize')) {
    const status = 400;
    return res.status(status).json({ statusCode: status, message: err.message, name: err.name });
  }
  next(err);
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({ statusCode: status, message: err.message || 'Internal Server Error' });
}

module.exports = { logErrors, boomErrorHandler, ormErrorHandler, errorHandler };
