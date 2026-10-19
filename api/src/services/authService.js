'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw new ApiError(500, 'Authentication is not configured', false);
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (input) => {
  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
  });
  return { token: signToken(user), user: user.toJSON() };
};

const login = async ({ email, password }) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user || !(await user.verifyPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return { token: signToken(user), user: user.toJSON() };
};

const getCurrentUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new ApiError(401, 'User account is no longer available');
  return user;
};

module.exports = { register, login, getCurrentUser };
