'use strict';
const service = require('../services/saleService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');
const create = catchAsyncError(async (req, res) => {
  const { items } = req.body;
  const sale = await service.create(req.user.id, { items });
  return sendResponse(res).created(sale, 'Sale created as pending; complete it to deduct stock');
});
const list = catchAsyncError(async (req, res) => {
  const result = await service.list(req.validatedQuery, req.user);
  return sendResponse(res).paginated(result.data, result.meta, 'Sales retrieved successfully');
});
const complete = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(
    await service.complete(req.params.id, req.user),
    'Sale completed; inventory deducted',
  ),
);
const cancel = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(await service.cancel(req.params.id, req.user), 'Sale cancelled'),
);
const summary = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(
    await service.summary(req.user, req.validatedQuery),
    'Sales summary retrieved successfully',
  ),
);
module.exports = { create, list, complete, cancel, summary };
