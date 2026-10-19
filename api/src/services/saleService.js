'use strict';

const { Op } = require('sequelize');
const {
  Sale,
  SaleItem,
  Product,
  StockMovement,
  User,
  Category,
  Supplier,
  sequelize,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { paginate, parsePaginationParams } = require('../utils/pagination');
const { addDateRange } = require('../utils/dateRange');

const toCents = (amount) => {
  const [whole, fraction = ''] = String(amount).split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
};

const saleInclude = [
  { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
  {
    model: SaleItem,
    as: 'items',
    include: [
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'sku'],
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'] },
          { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        ],
      },
    ],
  },
];

const create = async (userId, { items }) =>
  sequelize.transaction(async (transaction) => {
    const seen = new Set();
    for (const item of items) {
      if (seen.has(item.productId))
        throw new ApiError(400, 'A product can appear only once per sale');
      seen.add(item.productId);
    }
    const ids = items.map(({ productId }) => productId).sort();
    const products = await Product.findAll({
      where: { id: { [Op.in]: ids } },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (products.length !== ids.length)
      throw new ApiError(400, 'One or more products do not exist');
    const byId = new Map(products.map((product) => [product.id, product]));
    const lines = items.map((item) => {
      const product = byId.get(item.productId);
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        unitPriceCents: toCents(product.price),
      };
    });
    const totalCents = lines.reduce(
      (total, line) => total + line.quantity * line.unitPriceCents,
      0,
    );
    if (!Number.isSafeInteger(totalCents) || totalCents > 999999999999)
      throw new ApiError(400, 'Sale total exceeds the supported amount');
    const totalAmount = (totalCents / 100).toFixed(2);
    const reference = `SS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const sale = await Sale.create(
      { userId, reference, totalAmount, status: 'pending' },
      { transaction },
    );
    await SaleItem.bulkCreate(
      lines.map(({ unitPriceCents, ...line }) => ({ ...line, saleId: sale.id })),
      { transaction },
    );
    return Sale.findByPk(sale.id, { include: saleInclude, transaction });
  });

const list = async (query, requester) => {
  const where = {};
  if (query.status) where.status = query.status;
  if (requester.role !== 'admin') where.userId = requester.id;
  else if (query.userId) where.userId = query.userId;
  addDateRange(where, query.from, query.to);
  return paginate(
    Sale,
    { where, include: saleInclude, order: [['createdAt', query.sortOrder || 'DESC']] },
    parsePaginationParams(query),
  );
};

const complete = async (id, requester) =>
  sequelize.transaction(async (transaction) => {
    const where = { id };
    if (requester.role !== 'admin') where.userId = requester.id;
    const sale = await Sale.findOne({ where, transaction, lock: transaction.LOCK.UPDATE });
    if (!sale) throw new ApiError(404, 'Sale not found');
    if (sale.status !== 'pending') throw new ApiError(400, `Cannot complete a ${sale.status} sale`);
    const items = await SaleItem.findAll({ where: { saleId: sale.id }, transaction });
    const products = await Product.findAll({
      where: { id: { [Op.in]: items.map((item) => item.productId) } },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const byId = new Map(products.map((product) => [product.id, product]));
    for (const item of items) {
      const product = byId.get(item.productId);
      if (!product || product.stockQty < item.quantity)
        throw new ApiError(409, `Insufficient stock for product ${product?.sku || item.productId}`);
    }
    for (const item of items) {
      const product = byId.get(item.productId);
      await product.decrement('stockQty', { by: item.quantity, transaction });
      await StockMovement.create(
        { productId: product.id, saleId: sale.id, change: -item.quantity, reason: 'sale' },
        { transaction },
      );
    }
    sale.status = 'completed';
    await sale.save({ transaction });
    return Sale.findByPk(sale.id, { include: saleInclude, transaction });
  });

const cancel = async (id, requester) =>
  sequelize.transaction(async (transaction) => {
    const where = { id };
    if (requester.role !== 'admin') where.userId = requester.id;
    const sale = await Sale.findOne({ where, transaction, lock: transaction.LOCK.UPDATE });
    if (!sale) throw new ApiError(404, 'Sale not found');
    if (sale.status !== 'pending' && sale.status !== 'completed')
      throw new ApiError(400, 'Sale is already cancelled');
    if (sale.status === 'completed' && requester.role !== 'admin')
      throw new ApiError(403, 'Only an administrator can cancel a completed sale');
    if (sale.status === 'completed') {
      const items = await SaleItem.findAll({ where: { saleId: sale.id }, transaction });
      const products = await Product.findAll({
        where: { id: { [Op.in]: items.map((item) => item.productId) } },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const byId = new Map(products.map((product) => [product.id, product]));
      for (const item of items) {
        const product = byId.get(item.productId);
        if (!product) throw new ApiError(409, 'A sale product no longer exists');
        await product.increment('stockQty', { by: item.quantity, transaction });
        await StockMovement.create(
          {
            productId: product.id,
            saleId: sale.id,
            change: item.quantity,
            reason: 'sale_cancelled',
          },
          { transaction },
        );
      }
    }
    sale.status = 'cancelled';
    await sale.save({ transaction });
    return Sale.findByPk(sale.id, { include: saleInclude, transaction });
  });

const summary = async (requester, { from, to } = {}) => {
  const where = {};
  if (requester.role !== 'admin') where.userId = requester.id;
  addDateRange(where, from, to);
  const rows = await Sale.findAll({
    where,
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
    ],
    group: ['status'],
    raw: true,
  });
  return rows.reduce(
    (result, row) => {
      result[row.status] = { count: Number(row.count), revenue: Number(row.revenue || 0) };
      return result;
    },
    {
      pending: { count: 0, revenue: 0 },
      completed: { count: 0, revenue: 0 },
      cancelled: { count: 0, revenue: 0 },
    },
  );
};

module.exports = { create, list, complete, cancel, summary };
