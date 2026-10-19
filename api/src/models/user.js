const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.ENUM('admin', 'staff'), allowNull: false, defaultValue: 'staff' },
    },
    {
      tableName: 'users',
      hooks: {
        beforeValidate(user) {
          if (user.email) user.email = user.email.trim().toLowerCase();
        },
        async beforeSave(user) {
          if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
        },
      },
      defaultScope: { attributes: { exclude: ['password'] } },
      scopes: {
        withPassword: {
          attributes: ['id', 'name', 'email', 'password', 'role', 'createdAt', 'updatedAt'],
        },
      },
    },
  );

  User.prototype.verifyPassword = function verifyPassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  };

  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  User.associate = ({ User, Sale }) => User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });
  return User;
};
