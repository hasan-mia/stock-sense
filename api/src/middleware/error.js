'use strict';

const { sendResponse } = require('../utils/ApiResponse');

function globalErrorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.isOperational ? error.message : 'Internal server error';
  let errors = Array.isArray(error.errors) ? error.errors : [];

  if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = error.errors.map(({ path, message: detail }) => ({ field: path, message: detail }));
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'A record with this value already exists';
    errors = error.errors.map(({ path, message: detail }) => ({ field: path, message: detail }));
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 409;
    message = 'This record is still referenced and cannot be removed';
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON request body';
  } else if (error.name === 'MulterError') {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file exceeds the 15 MB limit'
        : 'Invalid file upload request';
  }

  if (statusCode >= 500) console.error(error);
  return sendResponse(res).error(statusCode, message, errors);
}

module.exports = globalErrorHandler;
