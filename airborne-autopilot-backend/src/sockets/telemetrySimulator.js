const Drone = require('../models/Drone');
const Flight = require('../models/Flight');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

const COLLISION_THRESHOLD = 40;

function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function movePosition(pos, targetX = 300, targetY = 300) {
  const dx = targetX - pos.x;
  const dy = targetY - pos.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: pos.x + (dx / len) * 2.5 + (Math.random() - 0.5),
    y: pos.y + (dy / len) * 2 + (Math.random() - 0.5),
    z: pos.z,
  };
}

function startTelemetrySimulator(io) {
  // Main telemetry tick — every 2 seconds
  setInterval(async () => {
    try {
      const flyingDrones = await Drone.find({ status: 'FLYING' });

      for (const drone of flyingDrones) {
        drone.battery = Math.max(0, drone.battery - 0.05);
        drone.position = movePosition(drone.position);
        drone.speed = 8 + Math.random() * 4;
        await drone.save();

        const telemetryPayload = {
          droneId:  drone.id,
          battery:  Math.round(drone.battery * 100) / 100,
          position: drone.position,
          speed:    Math.round(drone.speed * 10) / 10,
          status:   drone.status,
          timestamp: new Date(),
        };

        // Emit to subscribers of this specific drone
        io.to(`drone:${drone.id}`).emit('drone:telemetry', telemetryPayload);

        // Battery threshold alerts
        if (drone.battery < 10 && drone.status !== 'EMERGENCY') {
          drone.status = 'EMERGENCY';
          await drone.save();
          const alert = await Alert.create({
            droneId: drone.id,
            type: 'BATTERY',
            severity: 'CRITICAL',
            message: `CRITICAL: ${drone.name} battery at ${drone.battery.toFixed(1)}% — auto-landing`,
          });
          io.emit('drone:alert', alert.toObject());
          logger.warn(`Emergency triggered for ${drone.id}`);

        } else if (drone.battery < 20) {
          const existingAlert = await Alert.findOne({ droneId: drone.id, type: 'BATTERY', resolved: false });
          if (!existingAlert) {
            const alert = await Alert.create({
              droneId: drone.id,
              type: 'BATTERY',
              severity: 'WARNING',
              message: `${drone.name} battery low: ${drone.battery.toFixed(1)}%`,
            });
            io.emit('drone:alert', alert.toObject());
          }
        }

        // Update active flight telemetry
        const activeFlight = await Flight.findOne({ droneId: drone.id, status: 'FLYING' });
        if (activeFlight) {
          const tick = {
            tick: activeFlight.telemetry.length,
            timestamp: new Date(),
            x: drone.position.x,
            y: drone.position.y,
            z: drone.position.z,
            battery: drone.battery,
            event: null,
          };
          activeFlight.telemetry.push(tick);
          activeFlight.progress = Math.min(activeFlight.progress + 1, 100);
          await activeFlight.save();
        }
      }
    } catch (err) {
      logger.error(`Telemetry simulator error: ${err.message}`);
    }
  }, 2000);

  // Collision detection — every 3 seconds
  setInterval(async () => {
    try {
      const flyingDrones = await Drone.find({ status: 'FLYING' });
      for (let i = 0; i < flyingDrones.length; i++) {
        for (let j = i + 1; j < flyingDrones.length; j++) {
          const dist = distance(flyingDrones[i].position, flyingDrones[j].position);
          if (dist < COLLISION_THRESHOLD) {
            io.emit('collision:warning', {
              droneA:    flyingDrones[i].id,
              droneB:    flyingDrones[j].id,
              distance:  Math.round(dist),
              threshold: COLLISION_THRESHOLD,
              timestamp: new Date(),
            });
            logger.warn(`Collision risk: ${flyingDrones[i].id} ↔ ${flyingDrones[j].id} dist=${Math.round(dist)}`);
          }
        }
      }
    } catch (err) {
      logger.error(`Collision detection error: ${err.message}`);
    }
  }, 3000);

  // Full fleet snapshot — every 5 seconds
  setInterval(async () => {
    try {
      const drones = await Drone.find();
      io.to('fleet').emit('fleet:update', {
        drones: drones.map(d => ({ id: d.id, name: d.name, status: d.status, battery: d.battery, position: d.position })),
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error(`Fleet update error: ${err.message}`);
    }
  }, 5000);

  // Health score updates — every 30 seconds
  setInterval(async () => {
    try {
      const drones = await Drone.find();
      drones.forEach(drone => {
        const health = drone.getHealthScore();
        io.emit('health:update', { droneId: drone.id, ...health, timestamp: new Date() });
      });
    } catch (err) {
      logger.error(`Health update error: ${err.message}`);
    }
  }, 30000);

  // Revenue tick — every 60 seconds
  setInterval(async () => {
    try {
      const Revenue = require('../models/Revenue');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const result = await Revenue.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, revenue: { $sum: '$amount' }, cost: { $sum: '$cost' }, deliveries: { $sum: 1 } } },
      ]);
      const data = result[0] || { revenue: 0, cost: 0, deliveries: 0 };
      io.emit('revenue:tick', { ...data, timestamp: new Date() });
    } catch (err) {
      logger.error(`Revenue tick error: ${err.message}`);
    }
  }, 60000);

  logger.info('Telemetry simulator started');
}

module.exports = startTelemetrySimulator;
