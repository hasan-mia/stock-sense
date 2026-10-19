'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable('sales', {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      reference: { type: DataTypes.STRING(80), allowNull: true, unique: true },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex('sales', ['user_id'], { name: 'sales_user_id_idx' });
    await queryInterface.addIndex('sales', ['status', 'created_at'], {
      name: 'sales_status_created_at_idx',
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('sales');
  },
};
