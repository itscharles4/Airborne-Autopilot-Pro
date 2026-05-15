require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/socketHandler');
const startTelemetry = require('./sockets/telemetrySimulator');
const logger = require('./utils/logger');

// Import models and memory store
const Drone = require('./models/Drone');
const { getInstance: getMemoryStore } = require('./services/memoryStore');

// Import new services
const TelemetryEngine = require('./services/telemetryEngine');
const AdvancedPathfinding = require('./services/advancedPathfinding');
const DigitalTwinSimulator = require('./services/digitalTwinSimulator');
const WeatherService = require('./services/weatherService');
const AIService = require('./services/aiService');
const GeminiService = require('./services/geminiService');

const PORT = process.env.PORT || 5000;

async function seedDatabase() {
  try {
    // Try to count existing drones
    let existingCount = 0;
    try {
      existingCount = await Drone.countDocuments();
    } catch (e) {
      logger.warn('Could not query database, using memory store');
      // Use memory store instead
      const memStore = getMemoryStore();
      existingCount = memStore.drones.length;
    }

    if (existingCount === 0) {
      const sampleDrones = [
        {
          id: 'drone-alpha-1',
          name: 'Alpha-1',
          model: 'DJI Matrice 300',
          status: 'IDLE',
          battery: 95,
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 50,
          maxSpeed: 80,
          maxPayload: 2.7,
          sensors: ['4K Camera', 'Thermal', 'LiDAR'],
          firmwareVersion: '1.8.2',
        },
        {
          id: 'drone-bravo-2',
          name: 'Bravo-2',
          model: 'Freefly Alta X',
          status: 'IDLE',
          battery: 88,
          latitude: 40.7280,
          longitude: -74.0060,
          altitude: 75,
          maxSpeed: 60,
          maxPayload: 45,
          sensors: ['Industrial Camera', 'Thermal'],
          firmwareVersion: '2.1.0',
        },
        {
          id: 'drone-charlie-3',
          name: 'Charlie-3',
          model: 'DJI M350 RTK',
          status: 'IDLE',
          battery: 92,
          latitude: 40.6892,
          longitude: -74.0445,
          altitude: 0,
          maxSpeed: 75,
          maxPayload: 2.7,
          sensors: ['RGB Camera', 'RTK', 'LiDAR'],
          firmwareVersion: '1.7.5',
        },
        {
          id: 'drone-delta-4',
          name: 'Delta-4',
          model: 'Auterion Skynode',
          status: 'IDLE',
          battery: 85,
          latitude: 40.7489,
          longitude: -73.9680,
          altitude: 25,
          maxSpeed: 90,
          maxPayload: 5,
          sensors: ['Multi-Spectrum', 'Thermal'],
          firmwareVersion: '3.2.1',
        },
        {
          id: 'drone-echo-5',
          name: 'Echo-5',
          model: 'Aeryon SkyRanger X2',
          status: 'IDLE',
          battery: 90,
          latitude: 40.7505,
          longitude: -73.9972,
          altitude: 100,
          maxSpeed: 70,
          maxPayload: 3.2,
          sensors: ['HD Camera', 'Thermal', 'Gimbal'],
          firmwareVersion: '2.0.3',
        },
      ];

      try {
        await Drone.insertMany(sampleDrones);
        logger.info(`✅ Seeded ${sampleDrones.length} sample drones to MongoDB`);
      } catch (e) {
        // Fallback to memory store
        const memStore = getMemoryStore();
        await memStore.insertDrones(sampleDrones);
        logger.info(`✅ Seeded ${sampleDrones.length} sample drones to memory store`);
      }
    } else {
      logger.info(`📦 Database already contains ${existingCount} drones`);
    }
  } catch (error) {
    logger.warn('⚠️ Database seeding warning:', error.message);
  }
}

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Seed database with initial data
  await seedDatabase();

  // Create HTTP server
  const server = http.createServer(app);

  // Attach Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store io on app for access in controllers
  app.set('io', io);
  app.set('memoryStore', getMemoryStore());

  // Initialize services
  try {
    const geminiService = new GeminiService();
    const telemetryEngine = new TelemetryEngine(io);
    const pathfinding = new AdvancedPathfinding();
    const simulator = new DigitalTwinSimulator();
    const weatherService = new WeatherService();
    const aiService = new AIService(geminiService);

    // Store services on app
    app.set('telemetryEngine', telemetryEngine);
    app.set('pathfinding', pathfinding);
    app.set('simulator', simulator);
    app.set('weatherService', weatherService);
    app.set('aiService', aiService);
    app.set('geminiService', geminiService);

    logger.info('✅ All services initialized successfully');

    // Start telemetry engine
    await telemetryEngine.start();
    logger.info('🚀 Telemetry Engine started');
  } catch (error) {
    logger.error('⚠️ Service initialization warning:', error.message);
    // Continue anyway - services are optional for basic functionality
  }

  // Initialize socket event handlers
  initSocket(io);

  // Start telemetry simulator
  startTelemetry(io);

  // Start listening
  server.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info('Socket.IO ready for connections');
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
  });
}

startServer().catch(err => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
