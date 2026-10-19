'use strict';

require('dotenv').config();

const Redis = require('ioredis');

const retryStrategy = (attempt) => (attempt > 2 ? null : Math.min(attempt * 250, 1000));
const redisOptions = {
  lazyConnect: true,
  connectTimeout: 3000,
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
  retryStrategy,
};

const redisConnection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis({
      ...redisOptions,
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || process.env.REDIS_PASS || undefined,
      ...(process.env.REDIS_TLS === 'true' ? { tls: {} } : {}),
    });

let hasLoggedRedisWarning = false;

const logRedisUnavailable = () => {
  if (hasLoggedRedisWarning) return;
  hasLoggedRedisWarning = true;
  console.warn('Redis is unavailable; Gemini response caching is disabled.');
};

redisConnection.on('error', logRedisUnavailable);
redisConnection.on('ready', () => {
  hasLoggedRedisWarning = false;
  console.log('Redis ready');
});

const connectRedis = async () => {
  try {
    if (redisConnection.status === 'wait') await redisConnection.connect();
    await redisConnection.ping();
    return true;
  } catch {
    logRedisUnavailable();
    return false;
  }
};

const getCachedValue = async (key) => {
  try {
    const value = await redisConnection.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    logRedisUnavailable();
    return null;
  }
};

const setCachedValue = async (key, value, ttlSeconds = 900) => {
  try {
    await redisConnection.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch {
    logRedisUnavailable();
    return false;
  }
};

const closeConnections = async () => {
  if (redisConnection.status === 'ready') {
    await redisConnection.quit();
    return;
  }
  redisConnection.disconnect();
};

module.exports = {
  redisConnection,
  connectRedis,
  getCachedValue,
  setCachedValue,
  closeConnections,
};
