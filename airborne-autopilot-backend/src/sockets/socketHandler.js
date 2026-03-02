const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

function initSocket(io) {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (${socket.user?.name})`);

    socket.on('subscribe:drone', ({ droneId }) => {
      socket.join(`drone:${droneId}`);
      logger.info(`${socket.user?.name} subscribed to drone:${droneId}`);
    });

    socket.on('unsubscribe:drone', ({ droneId }) => {
      socket.leave(`drone:${droneId}`);
    });

    socket.on('subscribe:fleet', () => {
      socket.join('fleet');
    });

    socket.on('mission:confirm', (data) => {
      io.emit('mission:deployed', { ...data, confirmedBy: socket.user?.name });
    });

    socket.on('replay:start', ({ flightId }) => {
      socket.join(`replay:${flightId}`);
      io.to(`replay:${flightId}`).emit('replay:ready', { flightId });
    });

    socket.on('drone:command', ({ droneId, command }) => {
      io.emit('drone:commandAck', { droneId, command, issuedBy: socket.user?.name, timestamp: new Date() });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initSocket;
