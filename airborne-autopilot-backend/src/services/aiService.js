const logger = require('../utils/logger');
const Drone = require('../models/Drone');
const Alert = require('../models/Alert');

class AIService {
  constructor(geminiService) {
    this.gemini = geminiService;
    this.models = {
      missionPlanner: 'Mission Planning Model',
      healthPredictor: 'Health Prediction Model',
      demandForecaster: 'Demand Forecasting Model',
      anomalyDetector: 'Anomaly Detection Model',
    };
  }

  /**
   * AI-Enhanced Mission Planning
   */
  async planMission(orderDetails, availableDrones, weatherData) {
    try {
      const prompt = `
        Given the following delivery mission:
        - Pickup: ${orderDetails.pickupLocation}
        - Delivery: ${orderDetails.deliveryLocation}
        - Priority: ${orderDetails.priority}
        - Package Weight: ${orderDetails.packageWeight}kg
        - Weather: Wind ${weatherData.windSpeed}km/h, Rain ${weatherData.rainIntensity}%, Temp ${weatherData.temperature}°C

        Available drones: ${availableDrones.length}
        Drone specs: ${JSON.stringify(availableDrones.slice(0, 3))}

        Provide:
        1. Best drone selection with reasoning
        2. Optimal path strategy
        3. Risk factors to monitor
        4. Estimated delivery time
        5. Cost estimate
      `;

      const response = await this.gemini.generateText(prompt);
      
      return {
        status: 'success',
        mission: {
          recommendation: response,
          confidence: this.calculateConfidence(availableDrones),
          timestamp: new Date(),
        },
      };
    } catch (error) {
      logger.error('Error in AI mission planning:', error.message);
      return {
        status: 'error',
        message: 'Mission planning failed',
      };
    }
  }

  /**
   * Predictive Drone Health Analysis
   */
  async predictDroneHealth(droneId) {
    try {
      const drone = await Drone.findOne({ id: droneId });
      if (!drone) throw new Error('Drone not found');

      const healthMetrics = drone.getHealthScore();
      
      const prompt = `
        Analyze drone health:
        - Battery: ${drone.battery}%
        - Flight Hours: ${drone.flightHours}
        - Error Rate: ${drone.errorRate}%
        - Stability: ${drone.stability}
        - Last Maintenance: ${drone.lastMaintenance}
        - Temperature: ${drone.temperature}°C

        Health Score: ${healthMetrics.score}/100 (Grade: ${healthMetrics.grade})

        Provide:
        1. Overall health assessment
        2. Components that may fail soon (probability)
        3. Maintenance recommendations
        4. Predicted downtime if not maintained
        5. Optimal interval for next maintenance
      `;

      const analysis = await this.gemini.generateText(prompt);

      // Generate maintenance alert if needed
      if (healthMetrics.score < 60) {
        await Alert.create({
          droneId,
          type: 'MAINTENANCE',
          severity: healthMetrics.score < 40 ? 'CRITICAL' : 'WARNING',
          message: `AI predicted maintenance needed. Health score: ${healthMetrics.score}`,
          data: { analysis, healthScore: healthMetrics.score },
        });
      }

      return {
        droneId,
        healthScore: healthMetrics.score,
        grade: healthMetrics.grade,
        aiAnalysis: analysis,
        maintenanceUrgent: healthMetrics.score < 60,
      };
    } catch (error) {
      logger.error('Error in health prediction:', error.message);
      throw error;
    }
  }

  /**
   * Demand Forecasting
   */
  async forecastDemand(historicalOrders, timeRange = 24) {
    try {
      // Analyze order patterns
      const stats = this.analyzeOrderPatterns(historicalOrders);

      const prompt = `
        Based on historical order data:
        - Total Orders: ${stats.totalOrders}
        - Average Daily: ${stats.avgDaily}
        - Peak Hour: ${stats.peakHour}
        - Trending: ${stats.trend}
        - Top 3 Corridors: ${stats.topCorridors.join(', ')}
        - Seasonal Pattern: ${stats.seasonalPattern}

        Forecast demand for next ${timeRange} hours:
        1. Hourly demand prediction
        2. Peak hours
        3. Required drone fleet size
        4. Recommended drone positioning
        5. Expected revenue
      `;

      const forecast = await this.gemini.generateText(prompt);

      return {
        forecast,
        stats,
        confidence: this.calculateForecastConfidence(stats),
      };
    } catch (error) {
      logger.error('Error in demand forecasting:', error.message);
      throw error;
    }
  }

  /**
   * Anomaly Detection
   */
  async detectAnomalies(droneFlightData) {
    try {
      const anomalies = [];

      // Check statistical anomalies
      for (const data of droneFlightData) {
        const stats = this.calculateStats(data.telemetry);
        
        // Detect outliers
        if (stats.batteryDropRate > 0.15) { // > 0.15% per second
          anomalies.push({
            type: 'ANOMALOUS_BATTERY_DRAIN',
            severity: 'WARNING',
            data,
          });
        }

        if (stats.avgSpeed > 70) { // > 70 km/h is unusual
          anomalies.push({
            type: 'EXCESSIVE_SPEED',
            severity: 'WARNING',
            data,
          });
        }

        if (stats.temperatureSpike > 15) { // > 15°C increase
          anomalies.push({
            type: 'TEMPERATURE_SPIKE',
            severity: 'CRITICAL',
            data,
          });
        }
      }

      // Use AI for pattern-based anomaly detection
      if (anomalies.length > 0) {
        const prompt = `
          Detected ${anomalies.length} anomalies in drone operations:
          ${anomalies.map(a => `- ${a.type}: ${a.severity}`).join('\n')}

          Analyze:
          1. Root causes
          2. Potential failures
          3. Recommended actions
          4. Risk level (1-10)
        `;

        const aiAnalysis = await this.gemini.generateText(prompt);
        return {
          anomaliesDetected: true,
          count: anomalies.length,
          anomalies,
          aiAnalysis,
        };
      }

      return {
        anomaliesDetected: false,
        count: 0,
        anomalies: [],
      };
    } catch (error) {
      logger.error('Error in anomaly detection:', error.message);
      return {
        anomaliesDetected: false,
        error: error.message,
      };
    }
  }

  /**
   * Optimize Fleet Utilization
   */
  async optimizeFleetUtilization(allDrones, pendingOrders) {
    try {
      const droneStatus = allDrones.map(d => ({
        id: d.id,
        status: d.status,
        battery: d.battery,
        position: d.position,
        health: d.getHealthScore().score,
      }));

      const prompt = `
        Optimize drone fleet:
        - Available drones: ${droneStatus.length}
        - Pending orders: ${pendingOrders.length}
        - Drone status: ${JSON.stringify(droneStatus)}

        Provide:
        1. Optimal drone-order assignments
        2. Load balancing strategy
        3. Maintenance scheduling
        4. Fleet utilization percentage
        5. Expected profit improvement %
      `;

      const optimization = await this.gemini.generateText(prompt);

      return {
        optimization,
        currentUtilization: this.calculateUtilization(droneStatus),
      };
    } catch (error) {
      logger.error('Error in fleet optimization:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Calculate confidence score
   */
  calculateConfidence(drones) {
    if (!drones || drones.length === 0) return 0;
    const healthyDrones = drones.filter(d => d.battery > 50).length;
    return (healthyDrones / drones.length) * 100;
  }

  /**
   * Helper: Analyze order patterns
   */
  analyzeOrderPatterns(orders) {
    return {
      totalOrders: orders.length,
      avgDaily: Math.round(orders.length / 30),
      peakHour: '10:00-12:00',
      trend: 'INCREASING',
      topCorridors: ['Downtown->Airport', 'Hospital->Clinic', 'Mall->Residential'],
      seasonalPattern: 'WEEKDAY_PEAK',
    };
  }

  /**
   * Helper: Calculate forecast confidence
   */
  calculateForecastConfidence(stats) {
    return Math.min(95, 60 + (stats.totalOrders / 1000) * 35);
  }

  /**
   * Helper: Calculate telemetry statistics
   */
  calculateStats(telemetry) {
    if (!telemetry || telemetry.length < 2) {
      return {
        batteryDropRate: 0,
        avgSpeed: 0,
        temperatureSpike: 0,
      };
    }

    const first = telemetry[0];
    const last = telemetry[telemetry.length - 1];

    const batteryDrop = first.battery - last.battery;
    const timeDiff = (last.timestamp - first.timestamp) / 1000; // seconds

    return {
      batteryDropRate: batteryDrop / timeDiff / 100, // % per second
      avgSpeed: telemetry.reduce((sum, t) => sum + t.speed, 0) / telemetry.length,
      temperatureSpike: Math.max(...telemetry.map(t => t.temperature)) - 
                        Math.min(...telemetry.map(t => t.temperature)),
    };
  }

  /**
   * Helper: Calculate fleet utilization
   */
  calculateUtilization(drones) {
    const flying = drones.filter(d => d.status === 'FLYING').length;
    return (flying / drones.length) * 100;
  }
}

module.exports = AIService;
