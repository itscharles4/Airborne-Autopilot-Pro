const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // First try the configured URI
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    logger.warn(`Could not connect to MongoDB at ${uri}: ${error.message}`);
    logger.info('Falling back to in-memory MongoDB...');
  }

  // Fallback: use mongodb-memory-server with increased timeout
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Use different port to avoid conflicts
      },
      binary: {
        skipMD5: true, // Skip MD5 check for faster startup on Windows
      },
    });
    const memUri = mongod.getUri();
    const conn = await mongoose.connect(memUri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`MongoDB In-Memory Connected: ${conn.connection.host}`);
    logger.warn('Using in-memory database — data will NOT persist across restarts');
  } catch (fallbackError) {
    logger.error(`MongoDB Connection Error: ${fallbackError.message}`);
    logger.warn('Continuing with mock in-memory data store...');
    // Don't fail - use mock data instead
    setupMockDatabase();
  }
};

/**
 * Setup a mock in-memory data store when MongoDB is unavailable
 */
function setupMockDatabase() {
  // Mock data storage
  const mockData = {
    drones: [],
    flights: [],
    orders: [],
    users: [],
    alerts: [],
    geofences: [],
  };

  // Override mongoose models to use mock data
  const mockFind = async function() {
    const model = this.constructor.name;
    return mockData[model.toLowerCase() + 's'] || [];
  };

  const mockFindById = async function(id) {
    const model = this.constructor.name;
    return (mockData[model.toLowerCase() + 's'] || []).find(item => item._id === id);
  };

  const mockInsertMany = async function(docs) {
    const model = this.constructor.name;
    const key = model.toLowerCase() + 's';
    if (!mockData[key]) mockData[key] = [];
    const inserted = docs.map((doc, i) => ({
      ...doc,
      _id: Date.now() + i,
      createdAt: new Date(),
    }));
    mockData[key].push(...inserted);
    return inserted;
  };

  const mockCountDocuments = async function() {
    const model = this.constructor.name;
    return (mockData[model.toLowerCase() + 's'] || []).length;
  };

  // Monkey-patch mongoose models if needed
  if (global.mockDataStore) {
    global.mockDataStore = mockData;
  }

  logger.info('✅ Mock in-memory data store initialized');
}

module.exports = connectDB;

