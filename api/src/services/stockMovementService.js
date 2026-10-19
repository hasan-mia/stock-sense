'use strict';
const { StockMovement, Product, Sale } = require('../models');
const { paginate, parsePaginationParams } = require('../utils/pagination');
const { addDateRange } = require('../utils/dateRange');
const list = async (query) => {
  const where = {};
  if (query.productId) where.productId = query.productId;
  if (query.reason) where.reason = query.reason;
  addDateRange(where, query.from, query.to);
  return paginate(
    StockMovement,
    {
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku', 'stockQty'] },
        { model: Sale, as: 'sale', attributes: ['id', 'reference', 'status'], required: false },
      ],
      order: [
        ['createdAt', query.sortOrder || 'DESC'],
        ['id', 'DESC'],
      ],
    },
    parsePaginationParams(query),
  );
};
module.exports = { list };
