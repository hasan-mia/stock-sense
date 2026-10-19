'use strict';

const { sales, products } = require('../utils/demoData');

module.exports = {
  async up() {
    const { Product, Sale, SaleItem, sequelize } = require('../models');
    await sequelize.transaction(async (transaction) => {
      const productMap = {};
      for (const row of products) {
        productMap[row.sku] = await Product.findOne({ where: { sku: row.sku }, transaction });
      }
      for (const demoSale of sales) {
        const sale = await Sale.findOne({ where: { reference: demoSale.reference }, transaction });
        if (!sale) throw new Error(`Missing seeded sale ${demoSale.reference}.`);
        for (const item of demoSale.items) {
          const product = productMap[item.sku];
          await SaleItem.findOrCreate({
            where: { saleId: sale.id, productId: product.id },
            defaults: {
              saleId: sale.id,
              productId: product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              createdAt: demoSale.date,
              updatedAt: demoSale.date,
            },
            transaction,
          });
        }
      }
    });
  },
};
