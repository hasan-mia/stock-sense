'use strict';

const service = require('../services/supplierService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');
const list = catchAsyncError(async (req, res) => {
  const result = await service.list(req.validatedQuery);
  return sendResponse(res).paginated(result.data, result.meta, 'Suppliers retrieved successfully');
});
const create = catchAsyncError(async (req, res) => {
  const { name, phone, email } = req.body;
  const supplier = await service.create({ name, phone, email });
  return sendResponse(res).created(supplier, 'Supplier created successfully');
});
const update = catchAsyncError(async (req, res) => {
  const { name, phone, email } = req.body;
  const supplier = await service.update(req.params.id, { name, phone, email });
  return sendResponse(res).ok(supplier, 'Supplier updated successfully');
});
const remove = catchAsyncError(async (req, res) => {
  await service.remove(req.params.id);
  return sendResponse(res).ok(null, 'Supplier deleted successfully');
});
module.exports = { list, create, update, remove };
