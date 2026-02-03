const boom = require('@hapi/boom');
const { AppError } = require('../utils/errors');

function logErrors(err, _req, _res, next) {
  // eslint-disable-next-line no-console
  console.error(err);
  next(err);
}

function statusToCode(status) {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 409: return 'CONFLICT';
    case 422: return 'UNPROCESSABLE_ENTITY';
    default: return 'INTERNAL_SERVER_ERROR';
  }
}

function boomErrorHandler(err, _req, res, next) {
  if (boom.isBoom(err)) {
    const { output } = err;
    return res.status(output.statusCode).json({
      ok: false,
      statusCode: output.statusCode,
      error: statusToCode(output.statusCode),
      message: output.payload.message,
    });
  }
  next(err);
}

function ormErrorHandler(err, _req, res, next) {
  // Basic Sequelize error normalization; extend as needed
  if (err && err.name && err.name.includes('Sequelize')) {
    const status = 400;
    return res.status(status).json({
      ok: false,
      statusCode: status,
      error: statusToCode(status),
      message: err.message,
      details: err.name,
    });
  }
  next(err);
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      ok: false,
      statusCode: err.status,
      error: statusToCode(err.status),
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    statusCode: status,
    error: statusToCode(status),
    message: err.message || 'Internal Server Error',
  });
}

module.exports = { logErrors, boomErrorHandler, ormErrorHandler, errorHandler };
