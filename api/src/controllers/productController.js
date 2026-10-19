'use strict';

const service = require('../services/productService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');
const listProducts = catchAsyncError(async (req, res) => {
  const result = await service.list(req.validatedQuery);
  return sendResponse(res).paginated(result.data, result.meta, 'Products retrieved successfully');
});
const createProduct = catchAsyncError(async (req, res) => {
  const { name, sku, price, stockQty, reorderLevel, categoryId, supplierId } = req.body;
  const product = await service.create({
    name,
    sku,
    price,
    stockQty,
    reorderLevel,
    categoryId,
    supplierId,
  });
  return sendResponse(res).created(product, 'Product created successfully');
});
const updateProduct = catchAsyncError(async (req, res) => {
  const { name, sku, price, reorderLevel, categoryId, supplierId } = req.body;
  const product = await service.update(req.params.id, {
    name,
    sku,
    price,
    reorderLevel,
    categoryId,
    supplierId,
  });
  return sendResponse(res).ok(product, 'Product updated successfully');
});
const deleteProduct = catchAsyncError(async (req, res) => {
  await service.remove(req.params.id);
  return sendResponse(res).ok(null, 'Product deleted successfully');
});
const stockSummary = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(await service.summary(), 'Stock summary retrieved successfully'),
);
const lowStockProducts = catchAsyncError(async (req, res) => {
  const result = await service.list({ ...req.validatedQuery, lowStock: true });
  return sendResponse(res).paginated(
    result.data,
    result.meta,
    'Low-stock products retrieved successfully',
  );
});
const restockProduct = catchAsyncError(async (req, res) => {
  const { change, reason } = req.body;
  const product = await service.adjustStock(req.params.id, { change, reason });
  return sendResponse(res).ok(product, 'Product stock updated successfully');
});
module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  stockSummary,
  lowStockProducts,
  restockProduct,
};
