'use strict';

const Joi = require('joi');

const email = Joi.string().trim().lowercase().email().max(255).required();
const password = Joi.string().min(8).max(72).required();
const loginPassword = Joi.string().min(1).max(72).required();

const register = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email,
  password,
}).unknown(false);

const login = Joi.object({ email, password: loginPassword }).unknown(false);

module.exports = { register, login };
