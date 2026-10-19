'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('products', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      name: { type: DataTypes.STRING(180), allowNull: false },
      sku: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      stock_qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      reorder_level: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      supplier_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'suppliers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('products', ['category_id'], {
      name: 'products_category_id_idx',
    });
    await queryInterface.addIndex('products', ['supplier_id'], {
      name: 'products_supplier_id_idx',
    });
    await queryInterface.addIndex('products', ['stock_qty', 'reorder_level'], {
      name: 'products_stock_reorder_idx',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
