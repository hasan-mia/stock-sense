module.exports = (sequelize, DataTypes) => {
  const SaleItem = sequelize.define(
    'SaleItem',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      saleId: { type: DataTypes.UUID, allowNull: false, field: 'sale_id' },
      productId: { type: DataTypes.UUID, allowNull: false, field: 'product_id' },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, validate: { min: 1 } },
      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_price',
        validate: { min: 0 },
      },
    },
    {
      tableName: 'sale_items',
      indexes: [{ fields: ['sale_id'] }, { fields: ['product_id'] }],
    },
  );

  SaleItem.associate = ({ SaleItem, Sale, Product }) => {
    SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
    SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
  };
  return SaleItem;
};
