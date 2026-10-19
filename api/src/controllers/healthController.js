'use strict';

const { sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');

const getHealth = catchAsyncError(async (req, res) => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    throw new ApiError(503, 'Stock Sense API database is unavailable', true);
  }

  return sendResponse(res).ok(
    { status: 'ok', database: 'connected' },
    'Stock Sense API is healthy',
  );
});

module.exports = { getHealth };
