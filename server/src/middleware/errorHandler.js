'use strict';

/**
 * Centralised error handler — must be registered LAST in Express middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  // Avoid leaking stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';

  // ML service / downstream errors carry a custom statusCode
  const statusCode = err.statusCode || 500;

  console.error(`[error] ${req.method} ${req.path} → ${statusCode}: ${err.message}`);
  if (isDev) {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected error occurred.',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
