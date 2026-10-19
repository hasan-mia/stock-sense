'use strict';

const { categories } = require('../utils/demoData');

module.exports = {
  async up() {
    const { Category, sequelize } = require('../models');
    await sequelize.transaction(async (transaction) => {
      for (const name of categories) {
        await Category.findOrCreate({ where: { name }, defaults: { name }, transaction });
      }
    });
  },
};
