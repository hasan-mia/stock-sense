'use strict';
const service = require('../services/stockMovementService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');
const list = catchAsyncError(async (req, res) => {
  const result = await service.list(req.validatedQuery);
  return sendResponse(res).paginated(
    result.data,
    result.meta,
    'Stock movements retrieved successfully',
  );
});
module.exports = { list };
