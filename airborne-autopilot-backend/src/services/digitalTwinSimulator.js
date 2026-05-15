const DigitalTwin = require('../models/DigitalTwin');
const Drone = require('../models/Drone');
const Order = require('../models/Order');
const logger = require('../utils/logger');

class DigitalTwinSimulator {
  constructor() {
    this.simulations = new Map();
    this.simulationInterval = 100; // milliseconds between updates
  }

  /**
   * Create a new digital twin simulation
   */
  async createSimulation(config) {
    try {
      const simulation = new DigitalTwin({
        name: config.name,
        description: config.description,
        simulationType: config.simulationType || 'FLEET_WIDE',
        parameters: {
          fleetSize: config.fleetSize || 50,
          simulationDuration: config.duration || 3600,
          weatherCondition: config.weather || 'CLEAR',
          orderVolume: config.orders || 100,
          windSpeed: config.windSpeed || 0,
        },
        createdBy: config.userId,
      });

      // Initialize simulated drones
      for (let i = 0; i < config.fleetSize; i++) {
        simulation.drones.push({
          droneId: `DRONE-SIM-${i + 1}`,
          baseline: {
            battery: 100,
            speed: 0,
            altitude: 0,
            temperature: 25,
          },
          simulated: {
            battery: 100,
            speed: 0,
            altitude: 0,
            temperature: 25,
          },
          accuracy: 95,
        });
      }

      await simulation.save();
      logger.info(`✅ Digital Twin created: ${simulation._id}`);
      return simulation;
    } catch (error) {
      logger.error('Error creating digital twin:', error.message);
      throw error;
    }
  }

  /**
   * Run simulation
   */
  async runSimulation(simulationId, io) {
    try {
      const simulation = await DigitalTwin.findById(simulationId);
      if (!simulation) throw new Error('Simulation not found');

      await DigitalTwin.updateOne(
        { _id: simulationId },
        { status: 'RUNNING', startTime: new Date() }
      );

      logger.info(`🚀 Starting simulation: ${simulationId}`);
      io.emit('simulation:started', { simulationId });

      const startTime = Date.now();
      const totalDuration = simulation.parameters.simulationDuration * 1000;

      const runInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed / totalDuration) * 100;

        if (progress >= 100) {
          clearInterval(runInterval);
          await this.completeSimulation(simulationId);
          return;
        }

        // Update each drone
        await this.updateSimulatedDrones(simulationId, simulation, io);

        io.emit('simulation:progress', {
          simulationId,
          progress: Math.round(progress),
          elapsed: Math.round(elapsed / 1000),
        });
      }, this.simulationInterval);

      this.simulations.set(simulationId.toString(), runInterval);
    } catch (error) {
      logger.error('Error running simulation:', error.message);
    }
  }

  /**
   * Update all simulated drones
   */
  async updateSimulatedDrones(simulationId, simulation, io) {
    try {
      const updated = { ...simulation.toObject() };

      for (let i = 0; i < updated.drones.length; i++) {
        const drone = updated.drones[i];

        // Simulate battery consumption
        if (Math.random() > 0.7) { // Not all drones flying
          drone.simulated.battery = Math.max(0, drone.simulated.battery - 0.01);
          drone.simulated.speed = 30 + Math.random() * 20;
          drone.simulated.altitude = 50 + Math.random() * 70;
        } else {
          drone.simulated.speed = 0;
          drone.simulated.altitude = 0;
        }

        // Temperature variation
        drone.simulated.temperature = 25 + (Math.random() - 0.5) * 10;

        // Calculate accuracy (converges over time)
        drone.accuracy = Math.max(90, drone.accuracy - 0.1 + Math.random() * 0.05);

        // Random events
        if (Math.random() < 0.05) {
          const eventTypes = ['WEATHER_DELAY', 'MAINTENANCE_REQUIRED', 'COLLISION_AVOIDED'];
          updated.events.push({
            timestamp: new Date(),
            type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            droneId: drone.droneId,
          });
        }
      }

      // Update simulation metrics
      updated.results.droneUtilization = Math.round(
        (updated.drones.filter(d => d.simulated.speed > 0).length / updated.drones.length) * 100
      );

      updated.results.totalOrders = Math.round(simulation.parameters.orderVolume);
      updated.results.completedOrders = Math.round(
        simulation.parameters.orderVolume * (updated.results.droneUtilization / 100) * 0.95
      );
      updated.results.failedOrders = Math.round(
        simulation.parameters.orderVolume * (1 - updated.results.droneUtilization / 100) * 0.05
      );

      updated.results.averageDeliveryTime = Math.round(
        1200 + Math.random() * 600 // 20-30 minutes average
      );

      updated.results.totalRevenue = updated.results.completedOrders * 75;
      updated.results.maintenanceCost = updated.results.failedOrders * 500;

      // Save updates
      await DigitalTwin.updateOne({ _id: simulationId }, updated);

      // Broadcast to clients
      io.emit('simulation:update', {
        simulationId: simulationId.toString(),
        metrics: updated.results,
        droneCount: updated.drones.length,
      });
    } catch (error) {
      logger.error('Error updating simulated drones:', error.message);
    }
  }

  /**
   * Complete simulation
   */
  async completeSimulation(simulationId) {
    try {
      const interval = this.simulations.get(simulationId.toString());
      if (interval) {
        clearInterval(interval);
        this.simulations.delete(simulationId.toString());
      }

      await DigitalTwin.updateOne(
        { _id: simulationId },
        {
          status: 'COMPLETED',
          endTime: new Date(),
        }
      );

      logger.info(`✅ Simulation completed: ${simulationId}`);
    } catch (error) {
      logger.error('Error completing simulation:', error.message);
    }
  }

  /**
   * Pause simulation
   */
  async pauseSimulation(simulationId) {
    const interval = this.simulations.get(simulationId.toString());
    if (interval) {
      clearInterval(interval);
      await DigitalTwin.updateOne(
        { _id: simulationId },
        { status: 'PAUSED' }
      );
      logger.info(`⏸️ Simulation paused: ${simulationId}`);
    }
  }

  /**
   * Get simulation results
   */
  async getSimulationResults(simulationId) {
    return await DigitalTwin.findById(simulationId);
  }
}

module.exports = DigitalTwinSimulator;
