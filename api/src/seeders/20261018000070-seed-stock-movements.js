'use strict';

const { sales, products } = require('../utils/demoData');

module.exports = {
  async up() {
    const { Product, Sale, StockMovement, sequelize } = require('../models');
    await sequelize.transaction(async (transaction) => {
      const productMap = {};
      const soldBySku = Object.fromEntries(products.map((product) => [product.sku, 0]));
      for (const row of products) {
        productMap[row.sku] = await Product.findOne({ where: { sku: row.sku }, transaction });
      }
      for (const demoSale of sales) {
        for (const item of demoSale.items) soldBySku[item.sku] += item.quantity;
      }

      for (const row of products) {
        const product = productMap[row.sku];
        const openingMovement = await StockMovement.findOne({
          where: { productId: product.id, reason: 'initial_stock', saleId: null },
          transaction,
        });
        if (!openingMovement) {
          await StockMovement.create(
            {
              productId: product.id,
              change: row.finalStock + soldBySku[row.sku],
              reason: 'initial_stock',
            },
            { transaction },
          );
        }
      }

      for (const demoSale of sales) {
        const sale = await Sale.findOne({ where: { reference: demoSale.reference }, transaction });
        for (const item of demoSale.items) {
          const product = productMap[item.sku];
          const movement = await StockMovement.findOne({
            where: { productId: product.id, saleId: sale.id, reason: 'sale' },
            transaction,
          });
          if (!movement) {
            await StockMovement.create(
              {
                productId: product.id,
                saleId: sale.id,
                change: -item.quantity,
                reason: 'sale',
                createdAt: demoSale.date,
              },
              { transaction },
            );
          }
        }
      }
    });
  },
};
