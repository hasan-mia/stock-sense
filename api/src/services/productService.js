'use strict';

const { Op } = require('sequelize');
const { Product, Category, Supplier, StockMovement, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { paginate, parsePaginationParams } = require('../utils/pagination');

const include = [
  { model: Category, as: 'category', attributes: ['id', 'name'] },
  { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'phone', 'email'] },
];

const list = async (query) => {
  const where = {};
  if (query.search)
    where[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { sku: { [Op.like]: `%${query.search}%` } },
    ];
  for (const field of ['categoryId', 'supplierId']) if (query[field]) where[field] = query[field];
  if (query.lowStock)
    where[Op.and] = [
      ...(where[Op.and] || []),
      sequelize.where(sequelize.col('Product.stock_qty'), {
        [Op.lte]: sequelize.col('Product.reorder_level'),
      }),
    ];
  if (query.outOfStock) where.stockQty = 0;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price[Op.gte] = query.minPrice;
    if (query.maxPrice !== undefined) where.price[Op.lte] = query.maxPrice;
  }
  const result = await paginate(
    Product,
    { where, include, order: [[query.sortBy || 'createdAt', query.sortOrder || 'DESC']] },
    parsePaginationParams(query),
  );
  return result;
};
const create = async ({ name, sku, price, stockQty, reorderLevel, categoryId, supplierId }) =>
  sequelize.transaction(async (transaction) => {
    const product = await Product.create(
      { name, sku, price, stockQty, reorderLevel, categoryId, supplierId },
      { transaction },
    );
    if (product.stockQty > 0)
      await StockMovement.create(
        { productId: product.id, change: product.stockQty, reason: 'initial_stock' },
        { transaction },
      );
    return product.reload({ include, transaction });
  });
const update = async (id, input) => {
  if (Object.prototype.hasOwnProperty.call(input, 'stockQty'))
    throw new ApiError(400, 'Use stock adjustment to change inventory quantity');
  const changes = {};
  for (const field of ['name', 'sku', 'price', 'reorderLevel', 'categoryId', 'supplierId']) {
    if (input[field] !== undefined) changes[field] = input[field];
  }
  const product = await Product.findByPk(id);
  if (!product) throw new ApiError(404, 'Product not found');
  return product.update(changes).then(() => product.reload({ include }));
};
const remove = async (id) => {
  const product = await Product.findByPk(id);
  if (!product) throw new ApiError(404, 'Product not found');
  await product.destroy();
};
const summary = async () => {
  const [total, lowStock, outOfStock] = await Promise.all([
    Product.count(),
    Product.count({
      where: sequelize.where(sequelize.col('stock_qty'), {
        [Op.lte]: sequelize.col('reorder_level'),
      }),
    }),
    Product.count({ where: { stockQty: 0 } }),
  ]);
  return { total, lowStock, outOfStock };
};
const adjustStock = async (id, { change, reason }) =>
  sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.stockQty + change < 0)
      throw new ApiError(409, 'Stock adjustment cannot make inventory negative');
    if (product.stockQty + change > 4294967295)
      throw new ApiError(400, 'Stock exceeds the supported quantity');
    await product.increment('stockQty', { by: change, transaction });
    await StockMovement.create({ productId: id, change, reason }, { transaction });
    return product.reload({ include, transaction });
  });

module.exports = { list, create, update, remove, summary, adjustStock };
