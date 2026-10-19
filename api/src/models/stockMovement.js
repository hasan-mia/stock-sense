module.exports = (sequelize, DataTypes) => {
  const StockMovement = sequelize.define(
    'StockMovement',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
      saleId: { type: DataTypes.UUID, allowNull: true, field: 'sale_id' },
      change: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          nonZero(value) {
            if (value === 0) throw new Error('Stock movement change cannot be zero');
          },
        },
      },
      reason: {
        type: DataTypes.ENUM('initial_stock', 'restock', 'sale', 'sale_cancelled', 'adjustment'),
        allowNull: false,
      },
    },
    {
      tableName: 'stock_movements',
      // Keep Sequelize's timestamp attribute name consistent (`createdAt`);
      // `underscored: true` maps it to the existing `created_at` column.
      createdAt: true,
      updatedAt: false,
      indexes: [
        { fields: ['product_id', 'created_at'] },
        { fields: ['reason', 'created_at'] },
        { fields: ['sale_id'] },
      ],
    },
  );

  StockMovement.associate = ({ StockMovement, Product, Sale }) => {
    StockMovement.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
    StockMovement.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
  };
  return StockMovement;
};
