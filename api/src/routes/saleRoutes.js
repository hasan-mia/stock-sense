'use strict';
const express = require('express');
const controller = require('../controllers/saleController');
const validate = require('../middleware/validateRequest');
const { isAuthenticated } = require('../middleware/auth');
const schema = require('../validators/salesValidators');
const summaryQuery = require('joi')
  .object({ from: require('joi').string().isoDate(), to: require('joi').string().isoDate() })
  .unknown(false);
const router = express.Router();
router.use(isAuthenticated);
router.get('/summary', validate(summaryQuery, 'query'), controller.summary);
router.get('/', validate(schema.listQuery, 'query'), controller.list);
router.post('/', validate(schema.createSale), controller.create);
router.post('/:id/complete', validate(schema.idParams, 'params'), controller.complete);
router.post('/:id/cancel', validate(schema.idParams, 'params'), controller.cancel);
module.exports = router;
