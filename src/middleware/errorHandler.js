/**
 * Error Handling Middleware
 * Centralized error handling with proper logging and user-friendly responses
 */

const { logger } = require('../config/logger');
const config = require('../config/app');

// 404 Error Handler for API routes
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// 404 Handler for API routes specifically
const apiNotFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'API endpoint not found',
    path: req.originalUrl
  });
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = { message, status: 400 };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Handle specific duplicate field messages
    if (err.keyPattern && err.keyPattern.email) {
      message = 'This email is already registered on our waitlist!';
    }
    
    error = { message, status: 409 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join('. ');
    error = { message, status: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, status: 401 };
  }

  // CORS error
  if (err.message === 'Not allowed by CORS' || err.message.includes('CORS')) {
    error = {
      message: 'Request not allowed by CORS policy',
      status: 403
    };
  }

  // Rate limit error
  if (err.status === 429 || err.message.includes('Too many requests')) {
    error = {
      message: 'Too many requests. Please slow down and try again later.',
      status: 429
    };
  }

  // Request entity too large
  if (err.type === 'entity.too.large') {
    error = {
      message: 'Request payload too large',
      status: 413
    };
  }

  // Default to 500 server error
  const statusCode = error.status || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Send error response
  const errorResponse = {
    success: false,
    error: getErrorName(statusCode),
    message: message
  };

  // Include stack trace in development
  if (config.app.env === 'development') {
    errorResponse.stack = err.stack;
  }

  // Add specific fields for certain errors
  if (statusCode === 429) {
    errorResponse.retryAfter = '15 minutes';
  }

  if (statusCode === 413) {
    errorResponse.maxSize = '10MB';
  }

  res.status(statusCode).json(errorResponse);
};

// Helper function to get error name from status code
const getErrorName = (statusCode) => {
  const errorNames = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    413: 'Payload Too Large',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };

  return errorNames[statusCode] || 'Unknown Error';
};

// Async error wrapper to catch async/await errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Request timeout middleware
const requestTimeout = (timeout = 30000) => (req, res, next) => {
  res.setTimeout(timeout, () => {
    const error = new Error('Request timeout');
    error.status = 408;
    next(error);
  });
  next();
};

module.exports = {
  notFoundHandler,
  apiNotFoundHandler,
  globalErrorHandler,
  asyncHandler,
  requestTimeout
};