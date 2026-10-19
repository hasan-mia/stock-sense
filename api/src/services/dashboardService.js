'use strict';
const { Op } = require('sequelize');
const { Product, Category, Supplier, User, Sale, SaleItem, sequelize } = require('../models');
const { addDateRange } = require('../utils/dateRange');

const getOverview = async (requester, { from, to } = {}) => {
  const today = new Date();
  const startToday = new Date(today);
  startToday.setHours(0, 0, 0, 0);
  const completed = { status: 'completed' };
  const salesWhere = { ...completed };
  addDateRange(salesWhere, from, to);
  if (requester.role !== 'admin') salesWhere.userId = requester.id;
  const dashboardSalesWhere = {};
  addDateRange(dashboardSalesWhere, from, to);
  if (requester.role !== 'admin') dashboardSalesWhere.userId = requester.id;
  const todaySalesWhere = { status: 'completed', createdAt: { [Op.gte]: startToday } };
  if (requester.role !== 'admin') todaySalesWhere.userId = requester.id;
  const [
    totalProducts,
    totalCategories,
    totalSuppliers,
    lowStockCount,
    outOfStockCount,
    totalUsers,
    saleCounts,
    todayTotals,
    recentSales,
    topSelling,
  ] = await Promise.all([
    Product.count(),
    Category.count(),
    Supplier.count(),
    Product.count({
      where: sequelize.where(sequelize.col('stock_qty'), {
        [Op.lte]: sequelize.col('reorder_level'),
      }),
    }),
    Product.count({ where: { stockQty: 0 } }),
    requester.role === 'admin' ? User.count() : Promise.resolve(null),
    Sale.findAll({
      where: salesWhere,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      group: ['status'],
      raw: true,
    }),
    Sale.findOne({
      where: todaySalesWhere,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      raw: true,
    }),
    Sale.findAll({
      where: dashboardSalesWhere,
      limit: 8,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
    }),
    SaleItem.findAll({
      attributes: ['productId', [sequelize.fn('SUM', sequelize.col('quantity')), 'unitsSold']],
      include: [
        { model: Product, as: 'product', attributes: ['name', 'sku'] },
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: {
            status: 'completed',
            ...(requester.role === 'admin' ? {} : { userId: requester.id }),
          },
          required: true,
        },
      ],
      group: ['productId', 'product.id'],
      order: [[sequelize.literal('unitsSold'), 'DESC']],
      limit: 5,
      raw: true,
    }),
  ]);
  const status = { pending: 0, completed: 0, cancelled: 0 };
  let totalRevenue = 0;
  for (const row of saleCounts) {
    status[row.status] = Number(row.count);
    if (row.status === 'completed') totalRevenue = Number(row.revenue || 0);
  }
  return {
    totals: {
      products: totalProducts,
      categories: totalCategories,
      suppliers: totalSuppliers,
      ...(totalUsers === null ? {} : { users: totalUsers }),
      sales: status,
    },
    revenue: {
      completed: totalRevenue,
      today: Number(todayTotals?.revenue || 0),
      todaySales: Number(todayTotals?.count || 0),
    },
    inventory: { lowStock: lowStockCount, outOfStock: outOfStockCount },
    recentSales: recentSales.map((sale) => sale.toJSON()),
    topSellingProducts: topSelling.map((row) => ({
      productId: row.productId,
      name: row['product.name'],
      sku: row['product.sku'],
      unitsSold: Number(row.unitsSold),
    })),
  };
};

const getSalesByDay = async ({ from, to }) => {
  const where = { status: 'completed' };
  addDateRange(where, from, to);
  const sales = await Sale.findAll({
    where,
    attributes: ['createdAt', 'totalAmount'],
    order: [['createdAt', 'ASC']],
  });
  const days = new Map();
  for (const sale of sales) {
    const date = sale.createdAt.toISOString().slice(0, 10);
    const entry = days.get(date) || { date, sales: 0, revenue: 0 };
    entry.sales += 1;
    entry.revenue += Number(sale.totalAmount);
    days.set(date, entry);
  }
  return [...days.values()];
};
module.exports = { getOverview, getSalesByDay };
