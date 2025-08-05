const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('close', () => {
  logger.info('Redis client connection closed');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

// Helper functions
const cache = {
  // Get data from cache
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Set data in cache with expiration
  async set(key, data, expirationInSeconds = 3600) {
    try {
      await redisClient.setex(key, expirationInSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  // Delete from cache
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Set with pattern-based expiration
  async setWithPattern(pattern, data, expirationInSeconds = 3600) {
    try {
      const key = `ugo:${pattern}`;
      await redisClient.setex(key, expirationInSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Cache setWithPattern error:', error);
      return false;
    }
  },

  // Get with pattern
  async getWithPattern(pattern) {
    try {
      const key = `ugo:${pattern}`;
      return await this.get(key);
    } catch (error) {
      logger.error('Cache getWithPattern error:', error);
      return null;
    }
  },

  // Increment counter
  async increment(key, amount = 1) {
    try {
      const result = await redisClient.incrby(key, amount);
      return result;
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  },

  // Set expiration for existing key
  async expire(key, seconds) {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }
};

module.exports = redisClient;
module.exports.cache = cache;
