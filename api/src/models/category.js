module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    },
    {
      tableName: 'categories',
      hooks: {
        beforeValidate: (category) => {
          if (category.name) category.name = category.name.trim().replace(/\s+/g, ' ');
        },
      },
    },
  );

  Category.associate = ({ Category, Product }) =>
    Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
  return Category;
};
