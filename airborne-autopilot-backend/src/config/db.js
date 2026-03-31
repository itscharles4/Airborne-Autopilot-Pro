const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // First try the configured URI
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    logger.warn(`Could not connect to MongoDB at ${uri}: ${error.message}`);
    logger.info('Falling back to in-memory MongoDB...');
  }

  // Fallback: use mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    const conn = await mongoose.connect(memUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB In-Memory Connected: ${conn.connection.host}`);
    logger.warn('Using in-memory database — data will NOT persist across restarts');
  } catch (fallbackError) {
    logger.error(`MongoDB Connection Error: ${fallbackError.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
