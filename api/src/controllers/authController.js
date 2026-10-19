'use strict';

const authService = require('../services/authService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');

const register = catchAsyncError(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await authService.register({ name, email, password });
  return sendResponse(res).created(result, 'Account created successfully');
});

const login = catchAsyncError(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  return sendResponse(res).ok(result, 'Signed in successfully');
});

const me = catchAsyncError(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  return sendResponse(res).ok(user, 'Current user retrieved successfully');
});

module.exports = { register, login, me };
