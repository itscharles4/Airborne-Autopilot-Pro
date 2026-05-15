const Drone = require('../models/Drone');
const Flight = require('../models/Flight');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

class TelemetryEngine {
  constructor(io) {
    this.io = io;
    this.activeDrones = new Map();
    this.telemetryInterval = null;
    this.UPDATE_INTERVAL = 2000; // 2 seconds
  }

  /**
   * Start the telemetry engine - simulates real-time drone data
   */
  async start() {
    logger.info('🚀 Telemetry Engine started');
    
    this.telemetryInterval = setInterval(async () => {
      try {
        await this.updateFlyingDrones();
      } catch (error) {
        logger.error('❌ Telemetry update error:', error.message);
      }
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Update all flying drones with realistic telemetry
   */
  async updateFlyingDrones() {
    const flyingDrones = await Drone.find({ status: 'FLYING' });

    for (const drone of flyingDrones) {
      const flight = await Flight.findOne({
        droneId: drone.id,
        status: { $in: ['FLYING', 'HOVERING', 'REROUTING'] },
      });

      if (!flight) continue;

      // Simulate realistic telemetry updates
      const telemetryUpdate = this.generateRealisticTelemetry(drone, flight);

      // Update drone position and telemetry
      await this.updateDroneState(drone, telemetryUpdate);

      // Check for anomalies and alerts
      await this.checkAnomalies(drone, flight, telemetryUpdate);

      // Broadcast to connected clients
      this.io.emit('drone:telemetry', {
        droneId: drone.id,
        position: drone.position,
        battery: drone.battery,
        speed: drone.speed,
        temperature: drone.temperature,
        signalStrength: drone.signalStrength,
        status: drone.status,
        timestamp: new Date(),
      });

      // Check if flight is complete
      await this.checkFlightCompletion(drone, flight);
    }
  }

  /**
   * Generate realistic telemetry data based on current state
   */
  generateRealisticTelemetry(drone, flight) {
    // Simulate battery consumption (0.04-0.08% per update)
    const batteryConsumption = 0.04 + Math.random() * 0.04;
    const newBattery = Math.max(0, drone.battery - batteryConsumption);

    // Realistic position update based on speed and heading
    const speedVariation = 0.9 + Math.random() * 0.2; // ±10% speed variation
    const currentSpeed = drone.speed * speedVariation;
    
    // Movement in waypoint direction (simplified)
    const moveDistance = currentSpeed * (this.UPDATE_INTERVAL / 1000); // meters
    const angle = Math.random() * Math.PI * 2;
    const deltaX = Math.cos(angle) * moveDistance;
    const deltaY = Math.sin(angle) * moveDistance;
    
    // Temperature simulation (slight variation based on flight condition)
    const tempVariation = -2 + Math.random() * 4;
    const newTemp = Math.max(20, Math.min(60, drone.temperature + tempVariation * 0.1));

    // Signal strength (slight degradation with altitude)
    const signalDegrade = drone.position.z > 100 ? 0.5 : 0;
    const newSignal = Math.max(20, drone.signalStrength - signalDegrade);

    return {
      x: drone.position.x + deltaX,
      y: drone.position.y + deltaY,
      z: drone.position.z + (Math.random() - 0.5) * 2, // small vertical variation
      speed: currentSpeed,
      battery: newBattery,
      temperature: newTemp,
      signalStrength: newSignal,
      altitude: drone.position.z,
      heading: angle * (180 / Math.PI),
      timestamp: new Date(),
    };
  }

  /**
   * Update drone state in database
   */
  async updateDroneState(drone, telemetry) {
    try {
      await Drone.updateOne(
        { id: drone.id },
        {
          'position.x': telemetry.x,
          'position.y': telemetry.y,
          'position.z': telemetry.z,
          battery: telemetry.battery,
          speed: telemetry.speed,
          temperature: telemetry.temperature,
          signalStrength: telemetry.signalStrength,
          updatedAt: telemetry.timestamp,
        }
      );

      // Update flight telemetry log
      await Flight.updateOne(
        { droneId: drone.id, status: { $in: ['FLYING', 'HOVERING', 'REROUTING'] } },
        {
          $push: {
            telemetry: {
              tick: Date.now(),
              timestamp: telemetry.timestamp,
              x: telemetry.x,
              y: telemetry.y,
              z: telemetry.z,
              battery: telemetry.battery,
              speed: telemetry.speed,
              temperature: telemetry.temperature,
              signalStrength: telemetry.signalStrength,
              altitude: telemetry.altitude,
              heading: telemetry.heading,
            },
          },
          $set: { batteryConsumed: drone.battery - telemetry.battery },
        }
      );
    } catch (error) {
      logger.error('Error updating drone state:', error.message);
    }
  }

  /**
   * Check for anomalies and generate alerts
   */
  async checkAnomalies(drone, flight, telemetry) {
    // Low battery alert
    if (telemetry.battery < 20 && telemetry.battery > 10) {
      await this.createAlert(drone.id, flight._id, 'BATTERY', 'WARNING', 
        `Low battery: ${telemetry.battery.toFixed(1)}%`);
    }
    
    // Critical battery
    if (telemetry.battery < 10) {
      await this.createAlert(drone.id, flight._id, 'BATTERY', 'CRITICAL',
        `CRITICAL: Battery ${telemetry.battery.toFixed(1)}%`);
    }

    // Signal loss
    if (telemetry.signalStrength < 30) {
      await this.createAlert(drone.id, flight._id, 'SIGNAL_LOSS', 'WARNING',
        `Weak signal: ${telemetry.signalStrength}%`);
    }

    // Temperature warning
    if (telemetry.temperature > 55) {
      await this.createAlert(drone.id, flight._id, 'TEMPERATURE', 'WARNING',
        `High temperature: ${telemetry.temperature.toFixed(1)}°C`);
    }

    // Excessive speed
    if (telemetry.speed > 60) {
      await this.createAlert(drone.id, flight._id, 'SYSTEM', 'WARNING',
        `Speed exceeds limit: ${telemetry.speed.toFixed(1)} km/h`);
    }

    // High altitude
    if (telemetry.altitude > 120) {
      await this.createAlert(drone.id, flight._id, 'SYSTEM', 'WARNING',
        `Altitude exceeds limit: ${telemetry.altitude.toFixed(1)}m`);
    }
  }

  /**
   * Create alert
   */
  async createAlert(droneId, flightId, type, severity, message) {
    try {
      const existingAlert = await Alert.findOne({
        droneId,
        type,
        resolved: false,
      });

      if (!existingAlert) {
        await Alert.create({
          droneId,
          flightId,
          type,
          severity,
          message,
          data: { timestamp: new Date() },
        });

        // Emit alert
        this.io.emit('alert:new', {
          droneId,
          type,
          severity,
          message,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error creating alert:', error.message);
    }
  }

  /**
   * Check if flight is complete
   */
  async checkFlightCompletion(drone, flight) {
    // Simple check: if drone position is close to delivery node
    // In real system, would use proper waypoint tracking
    const distance = Math.sqrt(
      Math.pow(drone.position.x - 100, 2) + 
      Math.pow(drone.position.y - 100, 2)
    );

    if (distance < 10 && flight.status === 'FLYING') {
      // Flight complete
      await Flight.updateOne(
        { _id: flight._id },
        {
          status: 'LANDED',
          endTime: new Date(),
          duration: Math.round((new Date() - flight.startTime) / 1000),
        }
      );

      // Update drone status
      await Drone.updateOne(
        { id: drone.id },
        { status: 'IDLE' }
      );

      logger.info(`✅ Flight ${flight._id} completed`);
      this.io.emit('flight:completed', { flightId: flight._id });
    }
  }

  /**
   * Stop the telemetry engine
   */
  stop() {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      logger.info('⏹️ Telemetry Engine stopped');
    }
  }
}

module.exports = TelemetryEngine;
