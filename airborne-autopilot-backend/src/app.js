const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes       = require('./routes/auth');
const droneRoutes      = require('./routes/drones');
const orderRoutes      = require('./routes/orders');
const pathfinderRoutes = require('./routes/pathfinder');
const flightRoutes     = require('./routes/flights');
const revenueRoutes    = require('./routes/revenue');
const missionRoutes    = require('./routes/missions');
const alertRoutes      = require('./routes/alerts');

const app = express();

// Security & utilities
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api/v1', apiLimiter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// API routes
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/drones',      droneRoutes);
app.use('/api/v1/orders',      orderRoutes);
app.use('/api/v1/pathfinder',  pathfinderRoutes);
app.use('/api/v1/flights',     flightRoutes);
app.use('/api/v1/revenue',     revenueRoutes);
app.use('/api/v1/missions',    missionRoutes);
app.use('/api/v1/alerts',      alertRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.path} not found` }));

// Error handler
app.use(errorHandler);

module.exports = app;
