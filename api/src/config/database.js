const { sequelize } = require('../models');

async function connectDatabase() {
  await sequelize.authenticate();
  console.log('MySQL connection established.');
}

async function disconnectDatabase() {
  await sequelize.close();
}

module.exports = { connectDatabase, disconnectDatabase };
