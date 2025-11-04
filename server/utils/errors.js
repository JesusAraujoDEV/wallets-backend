class AppError extends Error {
  constructor(message, status = 500, details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class BadRequestError extends AppError { constructor(message = 'Bad Request', details) { super(message, 400, details); } }
class UnauthorizedError extends AppError { constructor(message = 'Unauthorized', details) { super(message, 401, details); } }
class ForbiddenError extends AppError { constructor(message = 'Forbidden', details) { super(message, 403, details); } }
class NotFoundError extends AppError { constructor(message = 'Not Found', details) { super(message, 404, details); } }
class ConflictError extends AppError { constructor(message = 'Conflict', details) { super(message, 409, details); } }

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
