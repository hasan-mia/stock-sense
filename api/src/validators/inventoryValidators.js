'use strict';

const Joi = require('joi');

const id = Joi.string().guid({ version: ['uuidv4'] });
const pageQuery = {
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().max(100),
  sortOrder: Joi.string().uppercase().valid('ASC', 'DESC'),
};
const categoryBody = Joi.object({ name: Joi.string().trim().min(1).max(100).required() }).unknown(
  false,
);
const supplierBody = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  phone: Joi.string().trim().max(40).allow('', null),
  email: Joi.string().trim().lowercase().email().max(255).allow(null).empty(''),
}).unknown(false);
const categoryUpdate = Joi.object({ name: Joi.string().trim().min(1).max(100) })
  .min(1)
  .unknown(false);
const supplierUpdate = Joi.object({
  name: Joi.string().trim().min(1).max(150),
  phone: Joi.string().trim().max(40).allow('', null),
  email: Joi.string().trim().lowercase().email().max(255).allow(null).empty(''),
})
  .min(1)
  .unknown(false);
const productFields = {
  name: Joi.string().trim().min(1).max(180),
  sku: Joi.string().trim().uppercase().min(1).max(64),
  price: Joi.number().min(0).max(9999999999.99).precision(2),
  stockQty: Joi.number().integer().min(0).max(4294967295),
  reorderLevel: Joi.number().integer().min(0).max(4294967295),
  categoryId: id,
  supplierId: id,
};
const productBody = Joi.object({
  name: productFields.name.required(),
  sku: productFields.sku.required(),
  price: productFields.price.required(),
  stockQty: productFields.stockQty.default(0),
  reorderLevel: productFields.reorderLevel.default(0),
  categoryId: productFields.categoryId.required(),
  supplierId: productFields.supplierId.required(),
}).unknown(false);
const { stockQty: _stockQty, ...productUpdateFields } = productFields;
const productUpdate = Joi.object(productUpdateFields).min(1).unknown(false);
const idParams = Joi.object({ id: id.required() }).unknown(false);
const categoryQuery = Joi.object({
  ...pageQuery,
  sortBy: Joi.string().valid('name', 'createdAt'),
}).unknown(false);
const supplierQuery = Joi.object({
  ...pageQuery,
  sortBy: Joi.string().valid('name', 'email', 'createdAt'),
}).unknown(false);
const productQuery = Joi.object({
  ...pageQuery,
  categoryId: id,
  supplierId: id,
  lowStock: Joi.boolean(),
  outOfStock: Joi.boolean(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  sortBy: Joi.string().valid('name', 'sku', 'price', 'stockQty', 'createdAt'),
}).unknown(false);
const stockAdjustment = Joi.object({
  change: Joi.number().integer().min(-4294967295).max(4294967295).invalid(0).required(),
  reason: Joi.string().valid('restock', 'adjustment').default('restock'),
  note: Joi.string().trim().max(500).allow('', null),
})
  .unknown(false)
  .custom((value, helpers) =>
    value.reason === 'restock' && value.change < 0 ? helpers.error('any.invalid') : value,
  );

module.exports = {
  idParams,
  categoryBody,
  categoryUpdate,
  supplierBody,
  supplierUpdate,
  productBody,
  productUpdate,
  categoryQuery,
  supplierQuery,
  productQuery,
  stockAdjustment,
};
