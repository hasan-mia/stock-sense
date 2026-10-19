'use strict';

const service = require('../services/categoryService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');
const list = catchAsyncError(async (req, res) => {
  const result = await service.list(req.validatedQuery);
  return sendResponse(res).paginated(result.data, result.meta, 'Categories retrieved successfully');
});
const create = catchAsyncError(async (req, res) => {
  const { name } = req.body;
  const category = await service.create({ name });
  return sendResponse(res).created(category, 'Category created successfully');
});
const update = catchAsyncError(async (req, res) => {
  const { name } = req.body;
  const category = await service.update(req.params.id, { name });
  return sendResponse(res).ok(category, 'Category updated successfully');
});
const remove = catchAsyncError(async (req, res) => {
  await service.remove(req.params.id);
  return sendResponse(res).ok(null, 'Category deleted successfully');
});
module.exports = { list, create, update, remove };
