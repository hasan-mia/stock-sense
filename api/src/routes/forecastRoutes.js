'use strict';
const express = require('express');
const Joi = require('joi');
const controller = require('../controllers/forecastController');
const validate = require('../middleware/validateRequest');
const { isAuthenticated } = require('../middleware/auth');
const query = Joi.object({
  days: Joi.number().integer().min(7).max(365),
  horizon: Joi.number().integer().min(1).max(365),
  categoryId: Joi.string().guid({ version: ['uuidv4'] }),
  safetyStock: Joi.number().min(0),
  explain: Joi.boolean(),
  from: Joi.string().isoDate(),
  to: Joi.string().isoDate(),
}).unknown(false);
const router = express.Router();
router.use(isAuthenticated);
const disableRecommendationCaching = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
  next();
};
router.get('/overview', validate(query, 'query'), controller.overview);
router.get('/products', validate(query, 'query'), controller.list);
router.get(
  '/restock-recommendations',
  disableRecommendationCaching,
  validate(query, 'query'),
  controller.recommendations,
);
router.get('/backtest', controller.backtest);
module.exports = router;
