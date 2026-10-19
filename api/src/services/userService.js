'use strict';

const { Op } = require('sequelize');
const { User, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { parsePaginationParams, paginate } = require('../utils/pagination');

const listUsers = async (query) => {
  const pagination = parsePaginationParams(query);
  const where = {};
  if (query.role) where.role = query.role;
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { email: { [Op.like]: `%${query.search}%` } },
    ];
  }
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder || 'DESC';
  return paginate(User, { where, order: [[sortBy, sortOrder]] }, pagination);
};

const findUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

const createUser = async (input) =>
  User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role || 'staff',
  });

const updateUser = async (id, input) => {
  const safeInput = {};
  for (const field of ['name', 'email', 'password', 'role']) {
    if (input[field] !== undefined) safeInput[field] = input[field];
  }
  if (!Object.keys(safeInput).length) throw new ApiError(400, 'No valid user fields provided');
  const user = await findUser(id);
  if (user.role === 'admin' && safeInput.role === 'staff') {
    await sequelize.transaction(async (transaction) => {
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (admins.length <= 1) throw new ApiError(400, 'The last administrator cannot be demoted');
      await user.update(safeInput, { transaction });
    });
    return user;
  }
  await user.update(safeInput);
  return user;
};

const deleteUser = async (id, requestingUserId) => {
  if (id === requestingUserId) throw new ApiError(400, 'You cannot delete your own account');
  const user = await findUser(id);
  await sequelize.transaction(async (transaction) => {
    if (user.role === 'admin') {
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id'],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (admins.length <= 1) throw new ApiError(400, 'The last administrator cannot be deleted');
    }
    await user.destroy({ transaction });
  });
};

module.exports = { listUsers, createUser, updateUser, deleteUser };
