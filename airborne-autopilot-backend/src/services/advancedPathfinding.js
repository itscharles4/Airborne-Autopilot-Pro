const logger = require('../utils/logger');
const Drone = require('../models/Drone');
const Flight = require('../models/Flight');
const Geofence = require('../models/Geofence');

class AdvancedPathfinding {
  constructor() {
    this.noFlyZones = new Set();
    this.loadGeofencesOnInit();
  }

  /**
   * Load geofences into memory for fast access
   */
  async loadGeofencesOnInit() {
    try {
      const geofences = await Geofence.find({ active: true, type: 'NO_FLY_ZONE' });
      this.noFlyZones = new Set(geofences.map(g => g._id.toString()));
      logger.info(`✅ Loaded ${geofences.length} geofences`);
    } catch (error) {
      logger.error('Error loading geofences:', error.message);
    }
  }

  /**
   * Check if point is inside geofence
   */
  async isInNoFlyZone(x, y, droneAltitude) {
    try {
      const geofences = await Geofence.find({ 
        active: true, 
        type: 'NO_FLY_ZONE',
      });

      for (const gf of geofences) {
        const distance = Math.sqrt(
          Math.pow(x - gf.center.lat, 2) + Math.pow(y - gf.center.lng, 2)
        );

        if (distance < gf.radius && 
            droneAltitude >= gf.minAltitude && 
            droneAltitude <= gf.maxAltitude) {
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error checking geofence:', error.message);
      return false;
    }
  }

  /**
   * Dijkstra algorithm for shortest path
   */
  dijkstra(graph, start, end, avoidNodes = []) {
    const distances = {};
    const visited = {};
    const previous = {};

    // Initialize
    for (const node in graph) {
      distances[node] = Infinity;
      visited[node] = false;
      previous[node] = null;
    }
    distances[start] = 0;

    while (true) {
      let minNode = null;
      let minDist = Infinity;

      for (const node in distances) {
        if (!visited[node] && distances[node] < minDist && !avoidNodes.includes(node)) {
          minNode = node;
          minDist = distances[node];
        }
      }

      if (minNode === null) break;
      if (minNode === end) break;

      visited[minNode] = true;

      for (const neighbor in graph[minNode]) {
        if (!avoidNodes.includes(neighbor)) {
          const newDist = distances[minNode] + graph[minNode][neighbor];
          if (newDist < distances[neighbor]) {
            distances[neighbor] = newDist;
            previous[neighbor] = minNode;
          }
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = end;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    return {
      path: path.length > 1 ? path : [start, end],
      distance: distances[end],
    };
  }

  /**
   * Dynamic rerouting when collision/obstacle detected
   */
  async dynamicReroute(flight, currentX, currentY, currentZ, destinationNode, graph) {
    try {
      // Check for collision/geofence
      const inNoFlyZone = await this.isInNoFlyZone(currentX, currentY, currentZ);

      if (inNoFlyZone || this.detectCollision(currentX, currentY, flight)) {
        logger.warn(`⚠️ Collision/Geofence detected for flight ${flight._id}`);

        // Calculate avoidance nodes (nodes near current position)
        const avoidanceRadius = 50; // meters
        const avoidNodes = this.getNodesInRadius(currentX, currentY, avoidanceRadius);

        // Recalculate path avoiding detected obstacles
        const newRoute = this.dijkstra(graph, 
          flight.currentNode, 
          flight.path[flight.path.length - 1],
          avoidNodes
        );

        // Update flight with new path
        await Flight.updateOne(
          { _id: flight._id },
          {
            path: newRoute.path,
            $push: {
              rerouteReason: `Dynamic reroute at (${currentX}, ${currentY}, ${currentZ})`,
            },
            reroutes: flight.reroutes + 1,
            status: 'REROUTING',
          }
        );

        logger.info(`🔄 Flight rerouted with new path: ${newRoute.path.join('->')}`);
        return newRoute.path;
      }

      return flight.path;
    } catch (error) {
      logger.error('Error during dynamic rerouting:', error.message);
      return flight.path;
    }
  }

  /**
   * Predictive pathing - anticipate future conflicts
   */
  async predictivePathing(flight, otherFlights, weather, predictHorizon = 300) {
    try {
      const predictions = [];

      // Predict positions of all drones in next predictHorizon seconds
      for (const otherFlight of otherFlights) {
        const predictedPos = this.predictPosition(otherFlight, predictHorizon);
        predictions.push({
          flightId: otherFlight._id,
          predictedPosition: predictedPos,
          timeHorizon: predictHorizon,
        });
      }

      // Check for predicted collisions
      const collisionRisk = this.evaluateCollisionRisk(flight, predictions);

      // Check for weather impacts
      const weatherRisk = this.evaluateWeatherRisk(flight, weather);

      // Probabilistic path reservation
      if (collisionRisk > 0.5 || weatherRisk > 0.5) {
        logger.warn(`⚠️ High risk detected - considering alternative path for ${flight._id}`);
        return {
          riskLevel: Math.max(collisionRisk, weatherRisk),
          recommendation: 'CONSIDER_ALTERNATIVE_PATH',
          predictions,
        };
      }

      return {
        riskLevel: Math.max(collisionRisk, weatherRisk),
        recommendation: 'PROCEED',
        predictions,
      };
    } catch (error) {
      logger.error('Error in predictive pathing:', error.message);
      return {
        riskLevel: 0,
        recommendation: 'PROCEED',
        predictions: [],
      };
    }
  }

  /**
   * Predict future position based on current trajectory
   */
  predictPosition(flight, seconds) {
    // Simple linear prediction
    if (flight.telemetry.length < 2) {
      return flight.waypoints[flight.currentNode] || { x: 0, y: 0, z: 0 };
    }

    const last = flight.telemetry[flight.telemetry.length - 1];
    const secondLast = flight.telemetry[flight.telemetry.length - 2];

    const vx = (last.x - secondLast.x) / (last.timestamp - secondLast.timestamp) * 1000;
    const vy = (last.y - secondLast.y) / (last.timestamp - secondLast.timestamp) * 1000;
    const vz = (last.z - secondLast.z) / (last.timestamp - secondLast.timestamp) * 1000;

    return {
      x: last.x + vx * seconds,
      y: last.y + vy * seconds,
      z: last.z + vz * seconds,
      timestamp: Date.now() + seconds * 1000,
    };
  }

  /**
   * Evaluate collision risk with other drones
   */
  evaluateCollisionRisk(flight, predictions) {
    let maxRisk = 0;

    for (const pred of predictions) {
      const distance = Math.sqrt(
        Math.pow(flight.position.x - pred.predictedPosition.x, 2) +
        Math.pow(flight.position.y - pred.predictedPosition.y, 2) +
        Math.pow(flight.position.z - pred.predictedPosition.z, 2)
      );

      // Minimum safe distance: 50 meters
      if (distance < 50) {
        const risk = 1 - (distance / 50);
        maxRisk = Math.max(maxRisk, risk);
      }
    }

    return Math.min(maxRisk, 1);
  }

  /**
   * Evaluate weather impact risk
   */
  evaluateWeatherRisk(flight, weather) {
    let risk = 0;

    if (weather.windSpeed > 25) risk += 0.3;
    if (weather.rainIntensity > 30) risk += 0.4;
    if (weather.visibility < 1000) risk += 0.3;

    return Math.min(risk, 1);
  }

  /**
   * Detect collision with obstacles
   */
  detectCollision(x, y, flight) {
    // Simplified collision detection
    // In real system, would use actual obstacle map
    const DANGER_RADIUS = 30; // meters

    // Check against waypoints
    for (const wp of flight.waypoints) {
      const dist = Math.sqrt(Math.pow(x - wp.x, 2) + Math.pow(y - wp.y, 2));
      if (dist < DANGER_RADIUS) return true;
    }

    return false;
  }

  /**
   * Get nodes within radius
   */
  getNodesInRadius(x, y, radius) {
    // Simplified - returns node indices near current position
    // In real system, would query actual node graph
    return [];
  }

  /**
   * Phantom Path Reservation (Patent idea)
   * Reserve routes probabilistically to avoid conflicts
   */
  async phantomPathReservation(flight, allFlights, reservationWindow = 600) {
    try {
      const reservedSegments = [];

      // For each segment of the path
      for (let i = 0; i < flight.path.length - 1; i++) {
        const startNode = flight.path[i];
        const endNode = flight.path[i + 1];

        // Check probability of conflict with other drones
        let conflictProbability = 0;
        for (const other of allFlights) {
          if (other._id.toString() !== flight._id.toString()) {
            if (other.path.includes(startNode) || other.path.includes(endNode)) {
              conflictProbability += 0.1;
            }
          }
        }

        // Reserve path segment if conflict probability high
        if (conflictProbability > 0.3) {
          reservedSegments.push({
            segment: `${startNode}->${endNode}`,
            conflictProbability,
            reservedUntil: new Date(Date.now() + reservationWindow * 1000),
          });
        }
      }

      return reservedSegments;
    } catch (error) {
      logger.error('Error in phantom path reservation:', error.message);
      return [];
    }
  }
}

module.exports = AdvancedPathfinding;
