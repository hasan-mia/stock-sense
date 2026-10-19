'use strict';
const express = require('express');
const controller = require('../controllers/categoryController');
const validate = require('../middleware/validateRequest');
const { isAuthenticated, requireRole } = require('../middleware/auth');
const schemas = require('../validators/inventoryValidators');
const router = express.Router();
router.use(isAuthenticated);
router.get('/', validate(schemas.categoryQuery, 'query'), controller.list);
router.post('/', requireRole('admin'), validate(schemas.categoryBody), controller.create);
router.patch(
  '/:id',
  requireRole('admin'),
  validate(schemas.idParams, 'params'),
  validate(schemas.categoryUpdate),
  controller.update,
);
router.delete(
  '/:id',
  requireRole('admin'),
  validate(schemas.idParams, 'params'),
  controller.remove,
);
module.exports = router;
