require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/socketHandler');
const startTelemetry = require('./sockets/telemetrySimulator');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const server = http.createServer(app);

  // Attach Socket.IO
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Store io on app for access in controllers
  app.set('io', io);

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
