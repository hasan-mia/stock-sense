const { Sequelize } = require('sequelize');

require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const sequelize = new Sequelize(config);

const db = { sequelize, Sequelize };
const modelFactories = [
  require('./user'),
  require('./category'),
  require('./supplier'),
  require('./product'),
  require('./sale'),
  require('./saleItem'),
  require('./stockMovement'),
];

for (const factory of modelFactories) {
  const model = factory(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

for (const model of Object.values(db)) {
  if (typeof model.associate === 'function') model.associate(db);
}

module.exports = db;
