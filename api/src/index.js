require('dotenv').config();

const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const { socket, closeSocket } = require('./config/socket');
const { connectRedis, closeConnections: closeRedis } = require('./config/redis');

const port = Number(process.env.PORT || 3000);
const server = http.createServer(app);
let isShuttingDown = false;

const start = async () => {
  await sequelize.authenticate();
  await connectRedis();
  socket(server);
  server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received; shutting down Stock Sense API...`);
  try {
    await closeSocket();
    await closeRedis();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Stock Sense API shutdown encountered an error:', error.message);
    process.exit(1);
  }
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

start().catch(async (error) => {
  console.error(
    'Stock Sense API could not connect to MySQL. Check DB_* settings and database availability.',
  );
  console.error(error.message);
  await closeSocket();
  await closeRedis();
  await sequelize.close();
  process.exit(1);
});
