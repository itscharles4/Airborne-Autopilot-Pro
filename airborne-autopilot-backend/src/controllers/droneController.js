const Drone = require('../models/Drone');
const Alert = require('../models/Alert');
const redis = require('../config/redis');

exports.getAllDrones = async (req, res, next) => {
  try {
    const drones = await Drone.find().sort({ name: 1 });
    const dronesWithHealth = drones.map(d => ({
      ...d.toObject(),
      health: d.getHealthScore(),
    }));
    res.json({ success: true, count: dronesWithHealth.length, data: dronesWithHealth });
  } catch (error) { next(error); }
};

exports.getDroneById = async (req, res, next) => {
  try {
    const drone = await Drone.findOne({ id: req.params.id }).populate('assignedOrder');
    if (!drone) return res.status(404).json({ success: false, message: 'Drone not found' });
    res.json({ success: true, data: { ...drone.toObject(), health: drone.getHealthScore() } });
  } catch (error) { next(error); }
};

exports.createDrone = async (req, res, next) => {
  try {
    const drone = await Drone.create(req.body);
    res.status(201).json({ success: true, data: drone });
  } catch (error) { next(error); }
};

exports.updateDrone = async (req, res, next) => {
  try {
    const drone = await Drone.findOneAndUpdate({ id: req.params.id }, req.body, {
      new: true, runValidators: true,
    });
    if (!drone) return res.status(404).json({ success: false, message: 'Drone not found' });
    res.json({ success: true, data: drone });
  } catch (error) { next(error); }
};

exports.deleteDrone = async (req, res, next) => {
  try {
    const drone = await Drone.findOneAndDelete({ id: req.params.id });
    if (!drone) return res.status(404).json({ success: false, message: 'Drone not found' });
    res.status(204).json({ success: true, data: null });
  } catch (error) { next(error); }
};

exports.getDroneHealth = async (req, res, next) => {
  try {
    const drone = await Drone.findOne({ id: req.params.id });
    if (!drone) return res.status(404).json({ success: false, message: 'Drone not found' });
    const health = drone.getHealthScore();
    const breakdown = {
      battery:     { value: drone.battery,       score: (drone.battery / 100) * 35,                               weight: 35 },
      maintenance: { value: drone.flightHours,   score: (1 - Math.min(drone.flightHours / 100, 1)) * 30,         weight: 30 },
      errorRate:   { value: drone.errorRate,     score: (1 - Math.min(drone.errorRate / 100, 1)) * 20,           weight: 20 },
      stability:   { value: drone.stability,     score: (drone.stability / 100) * 15,                            weight: 15 },
    };
    const recommendations = [];
    if (drone.battery < 30)       recommendations.push('Battery critically low — charge immediately');
    if (drone.flightHours > 80)   recommendations.push(`Maintenance due in ${100 - drone.flightHours} flight hours`);
    if (drone.errorRate > 10)     recommendations.push('High error rate — run diagnostics');
    if (drone.stability < 70)     recommendations.push('Stability issues detected — inspect gyroscope');

    res.json({ success: true, data: { droneId: drone.id, ...health, breakdown, recommendations } });
  } catch (error) { next(error); }
};

exports.getAvailableDrones = async (req, res, next) => {
  try {
    const drones = await Drone.find({ status: 'IDLE', battery: { $gte: 30 } });
    res.json({ success: true, count: drones.length, data: drones });
  } catch (error) { next(error); }
};

exports.sendCommand = async (req, res, next) => {
  try {
    const { command } = req.body;
    const drone = await Drone.findOne({ id: req.params.id });
    if (!drone) return res.status(404).json({ success: false, message: 'Drone not found' });

    const validCommands = {
      RETURN_HOME:    { status: 'FLYING' },
      EMERGENCY_LAND: { status: 'EMERGENCY' },
      START_CHARGING: { status: 'CHARGING' },
      SET_IDLE:       { status: 'IDLE', speed: 0 },
    };

    if (!validCommands[command]) {
      return res.status(400).json({ success: false, message: 'Invalid command' });
    }

    Object.assign(drone, validCommands[command]);
    await drone.save();

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) io.emit('drone:command', { droneId: drone.id, command, status: drone.status });

    res.json({ success: true, message: `Command ${command} sent`, data: drone });
  } catch (error) { next(error); }
};
