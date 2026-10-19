'use strict';
const service = require('../services/dashboardService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');
const overview = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(
    await service.getOverview(req.user, req.validatedQuery),
    'Dashboard overview retrieved successfully',
  ),
);
const salesByDay = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(
    await service.getSalesByDay(req.validatedQuery),
    'Daily sales retrieved successfully',
  ),
);
module.exports = { overview, salesByDay };
