'use strict';
const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/dashboardController');
const validate = require('../middleware/validateRequest');
const { isAuthenticated } = require('../middleware/auth');
const query = Joi.object({ from: Joi.string().isoDate(), to: Joi.string().isoDate() }).unknown(
  false,
);
const router = express.Router();
router.use(isAuthenticated);
router.get('/overview', validate(query, 'query'), controller.overview);
router.get('/sales-by-day', validate(query, 'query'), controller.salesByDay);
module.exports = router;
