'use strict';

const { sales, products } = require('../utils/demoData');

module.exports = {
  async up() {
    if (process.env.NODE_ENV === 'production')
      throw new Error('Demo seed data is disabled in production.');
    const { User, Product, Sale, sequelize } = require('../models');
    const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
    await sequelize.transaction(async (transaction) => {
      const admin = await User.findOne({ where: { email: adminEmail }, transaction });
      if (!admin) throw new Error('Run the user seeder before creating demo sales.');
      const productMap = {};
      for (const row of products) {
        productMap[row.sku] = await Product.findOne({ where: { sku: row.sku }, transaction });
      }

      for (const demoSale of sales) {
        const totalAmount = demoSale.items
          .reduce((total, item) => {
            const product = productMap[item.sku];
            return total + Number(product.price) * item.quantity;
          }, 0)
          .toFixed(2);
        await Sale.findOrCreate({
          where: { reference: demoSale.reference },
          defaults: {
            reference: demoSale.reference,
            userId: admin.id,
            totalAmount,
            status: 'completed',
            createdAt: demoSale.date,
            updatedAt: demoSale.date,
          },
          transaction,
        });
      }
    });
  },
};
