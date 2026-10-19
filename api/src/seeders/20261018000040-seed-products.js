'use strict';

const { categories, suppliers, products } = require('../utils/demoData');

module.exports = {
  async up() {
    const { Category, Supplier, Product, sequelize } = require('../models');
    await sequelize.transaction(async (transaction) => {
      const categoryMap = {};
      for (const name of categories) {
        categoryMap[name] = await Category.findOne({ where: { name }, transaction });
      }
      const supplierMap = {};
      for (const supplier of suppliers) {
        supplierMap[supplier.email] = await Supplier.findOne({
          where: { email: supplier.email },
          transaction,
        });
      }

      for (const row of products) {
        const values = {
          name: row.name,
          price: row.price,
          stockQty: row.finalStock,
          reorderLevel: row.reorderLevel,
          categoryId: categoryMap[row.category].id,
          supplierId: supplierMap[row.supplier].id,
        };
        const [product, created] = await Product.findOrCreate({
          where: { sku: row.sku },
          defaults: { ...values, sku: row.sku },
          transaction,
        });
        if (!created) await product.update(values, { transaction });
      }
    });
  },
};
