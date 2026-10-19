'use strict';

const { Op } = require('sequelize');
const { Category, Product, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { paginate, parsePaginationParams } = require('../utils/pagination');

const list = async (query) => {
  const where = query.search ? { name: { [Op.like]: `%${query.search}%` } } : {};
  const result = await paginate(
    Category,
    { where, order: [[query.sortBy || 'name', query.sortOrder || 'ASC']] },
    parsePaginationParams(query),
  );
  const counts = await Product.findAll({
    attributes: ['categoryId', [sequelize.fn('COUNT', sequelize.col('id')), 'productCount']],
    where: { categoryId: result.data.map((category) => category.id) },
    group: ['categoryId'],
    raw: true,
  });
  const countByCategory = new Map(counts.map((row) => [row.categoryId, Number(row.productCount)]));
  result.data.forEach((category) =>
    category.setDataValue('productCount', countByCategory.get(category.id) || 0),
  );
  return result;
};
const create = async ({ name }) => Category.create({ name });
const update = async (id, { name }) => {
  const row = await Category.findByPk(id);
  if (!row) throw new ApiError(404, 'Category not found');
  return row.update(name === undefined ? {} : { name });
};
const remove = async (id) => {
  const row = await Category.findByPk(id);
  if (!row) throw new ApiError(404, 'Category not found');
  await row.destroy();
};

module.exports = { list, create, update, remove };
