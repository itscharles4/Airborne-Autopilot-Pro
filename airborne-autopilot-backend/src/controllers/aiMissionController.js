const Order = require('../models/Order');
const Drone = require('../models/Drone');
const Flight = require('../models/Flight');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

/**
 * Generate mission plan using AI
 */
exports.generateMissionPlan = async (req, res) => {
  try {
    const { brief } = req.body;

    if (!brief) {
      return res.status(400).json({ error: 'Mission brief is required' });
    }

    const aiService = req.app.get('aiService');
    const weatherService = req.app.get('weatherService');
    const memoryStore = req.app.get('memoryStore');

    if (!aiService) {
      return res.status(500).json({ error: 'AI service not initialized' });
    }

    // Parse the mission brief to extract details
    const missionDetails = parseMissionBrief(brief);

    // Get available drones (from DB or memory store)
    let drones = [];
    try {
      drones = await Drone.find({ status: 'IDLE' }).limit(10);
    } catch (dbError) {
      logger.warn('Database query failed, using memory store');
      // Fall back to memory store
      if (memoryStore) {
        drones = await memoryStore.findDrones({ status: 'IDLE' });
        drones = drones.slice(0, 10);
      }
    }

    if (drones.length === 0) {
      return res.status(400).json({
        error: 'No available drones',
        suggestion: 'Some drones are currently in use. Try again later.',
      });
    }

    // Get weather data
    const weather = weatherService?.getCurrentWeather ? 
      await weatherService.getCurrentWeather(40.7128, -74.006) : // NYC default
      { temperature: 72, humidity: 65, windSpeed: 8 };

    // Generate mission plan using AI
    const missionPlan = await aiService.planMission(missionDetails, drones, weather);

    res.json({
      status: 'success',
      plan: missionPlan,
      availableDrones: drones.length,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error generating mission plan:', error.message);
    res.status(500).json({
      error: 'Failed to generate mission plan',
      message: error.message,
    });
  }
};

/**
 * Get drone health predictions
 */
exports.getDroneHealth = async (req, res) => {
  try {
    const { droneId } = req.params;
    const aiService = req.app.get('aiService');

    if (!aiService) {
      return res.status(500).json({ error: 'AI service not initialized' });
    }

    const health = await aiService.predictDroneHealth(droneId);

    res.json({
      status: 'success',
      health,
    });
  } catch (error) {
    logger.error('Error getting drone health:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Forecast demand
 */
exports.forecastDemand = async (req, res) => {
  try {
    const aiService = req.app.get('aiService');
    const memoryStore = req.app.get('memoryStore');

    if (!aiService) {
      return res.status(500).json({ error: 'AI service not initialized' });
    }

    // Get historical orders
    let orders = [];
    try {
      orders = await Order.find().limit(100);
    } catch (dbError) {
      if (memoryStore) {
        orders = await memoryStore.findOrders();
        orders = orders.slice(0, 100);
      }
    }

    const forecast = await aiService.forecastDemand(orders, 24);

    res.json({
      status: 'success',
      forecast,
    });
  } catch (error) {
    logger.error('Error forecasting demand:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Detect anomalies in flight data
 */
exports.detectAnomalies = async (req, res) => {
  try {
    const aiService = req.app.get('aiService');
    const memoryStore = req.app.get('memoryStore');

    if (!aiService) {
      return res.status(500).json({ error: 'AI service not initialized' });
    }

    // Get recent flights
    let flights = [];
    try {
      flights = await Flight.find()
        .sort({ createdAt: -1 })
        .limit(10);
    } catch (dbError) {
      if (memoryStore) {
        flights = await memoryStore.findFlights();
        flights = flights.slice(0, 10);
      }
    }

    const detection = await aiService.detectAnomalies(flights);

    res.json({
      status: 'success',
      detection,
    });
  } catch (error) {
    logger.error('Error detecting anomalies:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Optimize fleet utilization
 */
exports.optimizeFleet = async (req, res) => {
  try {
    const aiService = req.app.get('aiService');
    const memoryStore = req.app.get('memoryStore');

    if (!aiService) {
      return res.status(500).json({ error: 'AI service not initialized' });
    }

    let drones = [];
    let pendingOrders = [];
    
    try {
      drones = await Drone.find();
      pendingOrders = await Order.find({ status: 'PENDING' });
    } catch (dbError) {
      if (memoryStore) {
        drones = await memoryStore.findDrones();
        pendingOrders = await memoryStore.findOrders({ status: 'PENDING' });
      }
    }

    const optimization = await aiService.optimizeFleetUtilization(drones, pendingOrders);

    res.json({
      status: 'success',
      optimization,
    });
  } catch (error) {
    logger.error('Error optimizing fleet:', error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Helper: Parse mission brief
 */
function parseMissionBrief(brief) {
  return {
    description: brief,
    priority: 'STANDARD',
    pickupLocation: 'Current Location',
    deliveryLocation: 'Destination',
    packageWeight: 2,
  };
}
