'use strict';
const Joi = require('joi');
const uuid = Joi.string().guid({ version: ['uuidv4'] });
const createSale = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: uuid.required(),
        quantity: Joi.number().integer().min(1).max(4294967295).required(),
      }).unknown(false),
    )
    .min(1)
    .max(100)
    .unique('productId')
    .required(),
}).unknown(false);
const idParams = Joi.object({ id: uuid.required() }).unknown(false);
const listQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid('pending', 'completed', 'cancelled'),
  userId: uuid,
  from: Joi.string().isoDate(),
  to: Joi.string().isoDate(),
  sortOrder: Joi.string().uppercase().valid('ASC', 'DESC'),
}).unknown(false);
module.exports = { createSale, idParams, listQuery };
