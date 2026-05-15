const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Geofence = require('../models/Geofence');
const DigitalTwin = require('../models/DigitalTwin');
const logger = require('../utils/logger');

/**
 * GEOFENCING ROUTES
 */

// Get all geofences
router.get('/geofences', authMiddleware, async (req, res) => {
  try {
    const geofences = await Geofence.find();
    res.json({
      status: 'success',
      count: geofences.length,
      data: geofences,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create geofence
router.post('/geofences', authMiddleware, async (req, res) => {
  try {
    const geofence = new Geofence({
      ...req.body,
      createdBy: req.user._id,
    });
    await geofence.save();
    res.status(201).json({
      status: 'success',
      data: geofence,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update geofence
router.put('/geofences/:id', authMiddleware, async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({
      status: 'success',
      data: geofence,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete geofence
router.delete('/geofences/:id', authMiddleware, async (req, res) => {
  try {
    await Geofence.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Geofence deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DIGITAL TWIN SIMULATION ROUTES
 */

// Get all simulations
router.get('/simulations', authMiddleware, async (req, res) => {
  try {
    const simulations = await DigitalTwin.find().sort({ createdAt: -1 });
    res.json({
      status: 'success',
      count: simulations.length,
      data: simulations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create simulation
router.post('/simulations', authMiddleware, async (req, res) => {
  try {
    const simulation = new DigitalTwin({
      ...req.body,
      createdBy: req.user._id,
    });
    await simulation.save();
    res.status(201).json({
      status: 'success',
      data: simulation,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get simulation by ID
router.get('/simulations/:id', authMiddleware, async (req, res) => {
  try {
    const simulation = await DigitalTwin.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    res.json({
      status: 'success',
      data: simulation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start simulation
router.post('/simulations/:id/start', authMiddleware, async (req, res) => {
  try {
    const simulation = await DigitalTwin.findByIdAndUpdate(
      req.params.id,
      { status: 'RUNNING', startTime: new Date() },
      { new: true }
    );
    res.json({
      status: 'success',
      message: 'Simulation started',
      data: simulation,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pause simulation
router.post('/simulations/:id/pause', authMiddleware, async (req, res) => {
  try {
    const simulation = await DigitalTwin.findByIdAndUpdate(
      req.params.id,
      { status: 'PAUSED' },
      { new: true }
    );
    res.json({
      status: 'success',
      message: 'Simulation paused',
      data: simulation,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get simulation results
router.get('/simulations/:id/results', authMiddleware, async (req, res) => {
  try {
    const simulation = await DigitalTwin.findById(req.params.id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    res.json({
      status: 'success',
      results: simulation.results,
      events: simulation.events,
      drones: simulation.drones.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * AI SERVICE ROUTES
 */

// Plan mission with AI
router.post('/ai/plan-mission', authMiddleware, async (req, res) => {
  try {
    const { orderDetails, availableDrones, weatherData } = req.body;
    const aiService = req.app.get('aiService');

    const missionPlan = await aiService.planMission(orderDetails, availableDrones, weatherData);
    res.json({
      status: 'success',
      missionPlan,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Predict drone health
router.get('/ai/health/:droneId', authMiddleware, async (req, res) => {
  try {
    const aiService = req.app.get('aiService');
    const health = await aiService.predictDroneHealth(req.params.droneId);
    res.json({
      status: 'success',
      health,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Forecast demand
router.post('/ai/forecast-demand', authMiddleware, async (req, res) => {
  try {
    const { historicalOrders, timeRange } = req.body;
    const aiService = req.app.get('aiService');

    const forecast = await aiService.forecastDemand(historicalOrders, timeRange);
    res.json({
      status: 'success',
      forecast,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Detect anomalies
router.post('/ai/detect-anomalies', authMiddleware, async (req, res) => {
  try {
    const { droneFlightData } = req.body;
    const aiService = req.app.get('aiService');

    const detection = await aiService.detectAnomalies(droneFlightData);
    res.json({
      status: 'success',
      detection,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Optimize fleet utilization
router.post('/ai/optimize-fleet', authMiddleware, async (req, res) => {
  try {
    const { allDrones, pendingOrders } = req.body;
    const aiService = req.app.get('aiService');

    const optimization = await aiService.optimizeFleetUtilization(allDrones, pendingOrders);
    res.json({
      status: 'success',
      optimization,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * WEATHER SERVICE ROUTES
 */

// Get current weather
router.get('/weather/current', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const weatherService = req.app.get('weatherService');

    const weather = await weatherService.getCurrentWeather(parseFloat(lat), parseFloat(lng));
    res.json({
      status: 'success',
      weather,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Check flight suitability
router.get('/weather/flight-suitability', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const weatherService = req.app.get('weatherService');

    const weather = await weatherService.getCurrentWeather(parseFloat(lat), parseFloat(lng));
    const suitable = weatherService.isSuitableForFlight(weather);
    const impact = weatherService.getWeatherImpact(weather);

    res.json({
      status: 'success',
      suitable,
      weather,
      impact,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get weather forecast
router.get('/weather/forecast', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, hours } = req.query;
    const weatherService = req.app.get('weatherService');

    const forecast = await weatherService.predictWeather(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(hours) || 4
    );

    res.json({
      status: 'success',
      forecast,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get weather alerts
router.get('/weather/alerts', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const weatherService = req.app.get('weatherService');

    const alerts = await weatherService.getWeatherAlerts(parseFloat(lat), parseFloat(lng));
    res.json({
      status: 'success',
      alerts,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
