import { AppError } from '../utils/errors.util.js';
import { sendError } from '../utils/response.util.js';

/**
 * Global error handler middleware.
 * 
 * Express identifies this as an error handler because it has 4 parameters (err, req, res, next).
 * Spring Boot uses @ControllerAdvice + @ExceptionHandler for the same purpose.
 * 
 * Must be registered LAST in app.js (after all routes).
 */
const errorMiddleware = (err, req, res, next) => {
  // Log error details
  console.error(`[ERROR] ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma-specific errors
  if (err.code === 'P2002') {
    // Unique constraint violation (e.g., duplicate email)
    return sendError(res, {
      statusCode: 409,
      message: 'A record with this value already exists',
      errors: err.meta?.target,
    });
  }

  if (err.code === 'P2025') {
    // Record not found
    return sendError(res, {
      statusCode: 404,
      message: 'Record not found',
    });
  }

  // Our custom operational errors
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // Unknown/unexpected errors — don't leak internals
  return sendError(res, {
    statusCode: 500,
    message: 'Something went wrong. Please try again later.',
  });
};

export default errorMiddleware;