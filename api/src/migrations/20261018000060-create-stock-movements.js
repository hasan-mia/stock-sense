'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('stock_movements', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sale_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      change: { type: DataTypes.INTEGER, allowNull: false },
      reason: {
        type: DataTypes.ENUM('initial_stock', 'restock', 'sale', 'sale_cancelled', 'adjustment'),
        allowNull: false,
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('stock_movements', ['product_id', 'created_at'], {
      name: 'stock_movements_product_created_idx',
    });
    await queryInterface.addIndex('stock_movements', ['reason', 'created_at'], {
      name: 'stock_movements_reason_created_idx',
    });
    await queryInterface.addIndex('stock_movements', ['sale_id'], {
      name: 'stock_movements_sale_id_idx',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('stock_movements');
  },
};
