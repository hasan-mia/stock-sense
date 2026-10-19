'use strict';

const Joi = require('joi');

const fields = {
  name: Joi.string().trim().min(2).max(120),
  email: Joi.string().trim().lowercase().email().max(255),
  password: Joi.string().min(8).max(72),
  role: Joi.string().valid('admin', 'staff'),
};

const createUser = Joi.object({
  name: fields.name.required(),
  email: fields.email.required(),
  password: fields.password.required(),
  role: fields.role.default('staff'),
}).unknown(false);

const updateUser = Joi.object(fields).min(1).unknown(false);
const userId = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
}).unknown(false);
const listUsers = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().max(100),
  role: fields.role,
  sortBy: Joi.string().valid('name', 'email', 'role', 'createdAt'),
  sortOrder: Joi.string().uppercase().valid('ASC', 'DESC'),
}).unknown(false);

module.exports = { createUser, updateUser, userId, listUsers };
