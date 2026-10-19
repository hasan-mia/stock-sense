module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    'Supplier',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(40), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true, validate: { isEmail: true } },
    },
    {
      tableName: 'suppliers',
      indexes: [{ unique: true, fields: ['email'] }],
      hooks: {
        beforeValidate(supplier) {
          if (supplier.name) supplier.name = supplier.name.trim().replace(/\s+/g, ' ');
          if (supplier.email) supplier.email = supplier.email.trim().toLowerCase();
          if (supplier.phone) supplier.phone = supplier.phone.trim().replace(/[\s()-]/g, '');
        },
      },
    },
  );

  Supplier.associate = ({ Supplier, Product }) =>
    Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });
  return Supplier;
};
