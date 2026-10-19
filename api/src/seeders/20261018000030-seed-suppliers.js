'use strict';

const { suppliers } = require('../utils/demoData');

module.exports = {
  async up() {
    const { Supplier, sequelize } = require('../models');
    await sequelize.transaction(async (transaction) => {
      for (const supplier of suppliers) {
        const [record, created] = await Supplier.findOrCreate({
          where: { email: supplier.email },
          defaults: { name: supplier.name, email: supplier.email, phone: supplier.phone },
          transaction,
        });
        if (!created)
          await record.update({ name: supplier.name, phone: supplier.phone }, { transaction });
      }
    });
  },
};
