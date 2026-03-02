const Redis = require('ioredis');
const logger = require('../utils/logger');

const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => logger.info('Redis Connected'));
redis.on('error', (err) => logger.error(`Redis Error: ${err.message}`));

module.exports = redis;
