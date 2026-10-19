'use strict';

const express = require('express');
const controller = require('../controllers/productController');
const validate = require('../middleware/validateRequest');
const { isAuthenticated, requireRole } = require('../middleware/auth');
const schemas = require('../validators/inventoryValidators');

const router = express.Router();
router.use(isAuthenticated);
router.get('/stock/summary', controller.stockSummary);
router.get('/stock/low', validate(schemas.productQuery, 'query'), controller.lowStockProducts);
router.post(
  '/:id/stock-adjustments',
  requireRole('admin'),
  validate(schemas.idParams, 'params'),
  validate(schemas.stockAdjustment),
  controller.restockProduct,
);
router.get('/', validate(schemas.productQuery, 'query'), controller.listProducts);
router.post('/', requireRole('admin'), validate(schemas.productBody), controller.createProduct);
router.patch(
  '/:id',
  requireRole('admin'),
  validate(schemas.idParams, 'params'),
  validate(schemas.productUpdate),
  controller.updateProduct,
);
router.delete(
  '/:id',
  requireRole('admin'),
  validate(schemas.idParams, 'params'),
  controller.deleteProduct,
);

module.exports = router;
