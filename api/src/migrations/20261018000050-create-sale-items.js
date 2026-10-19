'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('sale_items', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      sale_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'sales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('sale_items', ['sale_id'], { name: 'sale_items_sale_id_idx' });
    await queryInterface.addIndex('sale_items', ['product_id'], {
      name: 'sale_items_product_id_idx',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('sale_items');
  },
};
