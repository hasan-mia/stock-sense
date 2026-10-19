'use strict';
const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/stockMovementController');
const validate = require('../middleware/validateRequest');
const { isAuthenticated } = require('../middleware/auth');
const schema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  productId: Joi.string().guid({ version: ['uuidv4'] }),
  reason: Joi.string().valid('initial_stock', 'restock', 'sale', 'sale_cancelled', 'adjustment'),
  from: Joi.string().isoDate(),
  to: Joi.string().isoDate(),
  sortOrder: Joi.string().uppercase().valid('ASC', 'DESC'),
}).unknown(false);
const router = express.Router();
router.get('/', isAuthenticated, validate(schema, 'query'), controller.list);
module.exports = router;
