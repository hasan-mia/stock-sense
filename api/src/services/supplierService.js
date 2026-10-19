'use strict';

const { Op } = require('sequelize');
const { Supplier } = require('../models');
const ApiError = require('../utils/ApiError');
const { paginate, parsePaginationParams } = require('../utils/pagination');

const list = async (query) => {
  const where = query.search
    ? {
        [Op.or]: [
          { name: { [Op.like]: `%${query.search}%` } },
          { email: { [Op.like]: `%${query.search}%` } },
          { phone: { [Op.like]: `%${query.search}%` } },
        ],
      }
    : {};
  return paginate(
    Supplier,
    { where, order: [[query.sortBy || 'name', query.sortOrder || 'ASC']] },
    parsePaginationParams(query),
  );
};
const get = async (id) => {
  const row = await Supplier.findByPk(id);
  if (!row) throw new ApiError(404, 'Supplier not found');
  return row;
};
const create = async ({ name, phone, email }) => Supplier.create({ name, phone, email });
const update = async (id, { name, phone, email }) => {
  const row = await get(id);
  const changes = {};
  for (const [field, value] of Object.entries({ name, phone, email })) {
    if (value !== undefined) changes[field] = value;
  }
  return row.update(changes);
};
const remove = async (id) => {
  const row = await get(id);
  await row.destroy();
};

module.exports = { list, create, update, remove };
