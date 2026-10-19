require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const ApiError = require('./utils/ApiError');
const globalErrorHandler = require('./middleware/error');
const apiRoutes = require('./routes');
const { UPLOAD_DIR } = require('./config/paths');

const app = express();
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : '*';

app.disable('x-powered-by');
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ origin: corsOrigin, credentials: corsOrigin !== '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(
  '/uploads',
  express.static(UPLOAD_DIR, { fallthrough: false, maxAge: '1d', immutable: false }),
);
app.use('/api/v1', apiRoutes);

app.use((req, res, next) => next(new ApiError(404, 'Route not found')));
app.use(globalErrorHandler);

module.exports = app;
