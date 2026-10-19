module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define(
    'Sale',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      reference: { type: DataTypes.STRING(80), allowNull: true, unique: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      totalAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'sales',
      indexes: [{ fields: ['user_id'] }, { fields: ['status', 'created_at'] }],
    },
  );

  Sale.associate = ({ Sale, User, SaleItem, StockMovement }) => {
    Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
    Sale.hasMany(StockMovement, { foreignKey: 'saleId', as: 'stockMovements' });
  };
  return Sale;
};
