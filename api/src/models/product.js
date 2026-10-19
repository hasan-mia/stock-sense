module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING(180), allowNull: false },
      sku: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
      stockQty: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: 'stock_qty',
        validate: { min: 0 },
      },
      reorderLevel: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: 'reorder_level',
      },
      categoryId: { type: DataTypes.UUID, allowNull: false, field: 'category_id' },
      supplierId: { type: DataTypes.UUID, allowNull: false, field: 'supplier_id' },
    },
    {
      tableName: 'products',
      indexes: [
        { fields: ['category_id'] },
        { fields: ['supplier_id'] },
        { fields: ['stock_qty', 'reorder_level'] },
      ],
      hooks: {
        beforeValidate: (product) => {
          if (product.sku) product.sku = product.sku.trim().toUpperCase();
        },
      },
      validate: {
        nonnegativeReorderLevel() {
          if (this.reorderLevel < 0) throw new Error('Reorder level cannot be negative');
        },
      },
    },
  );

  Product.associate = ({ Product, Category, Supplier, SaleItem, StockMovement }) => {
    Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
    Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });
    Product.hasMany(StockMovement, { foreignKey: 'productId', as: 'stockMovements' });
  };
  return Product;
};
