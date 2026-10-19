'use strict';
const express = require('express');
const controller = require('../controllers/supplierController');
const validate = require('../middleware/validateRequest');
const { isAuthenticated, requireRole } = require('../middleware/auth');
const schemas = require('../validators/inventoryValidators');
const router = express.Router();
router.use(isAuthenticated);
router.get('/', validate(schemas.supplierQuery, 'query'), controller.list);
router.post('/', requireRole('admin'), validate(schemas.supplierBody), controller.create);
router.patch(
  '/:id',
  requireRole('admin'),
  validate(schemas.idParams, 'params'),
  validate(schemas.supplierUpdate),
  controller.update,
);
router.delete(
  '/:id',
  requireRole('admin'),
  validate(schemas.idParams, 'params'),
  controller.remove,
);
module.exports = router;
