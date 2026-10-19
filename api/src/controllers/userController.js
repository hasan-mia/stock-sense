'use strict';

const userService = require('../services/userService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');

const listUsers = catchAsyncError(async (req, res) => {
  const result = await userService.listUsers(req.validatedQuery || req.query);
  return sendResponse(res).paginated(result.data, result.meta, 'Users retrieved successfully');
});

const createUser = catchAsyncError(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await userService.createUser({ name, email, password, role });
  return sendResponse(res).created(user, 'User created successfully');
});

const updateUser = catchAsyncError(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await userService.updateUser(req.params.id, { name, email, password, role });
  return sendResponse(res).ok(user, 'User updated successfully');
});

const deleteUser = catchAsyncError(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user.id);
  return sendResponse(res).ok(null, 'User deleted successfully');
});

module.exports = { listUsers, createUser, updateUser, deleteUser };
