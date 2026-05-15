const mongoose = require('mongoose');
const { Schema } = mongoose;

const droneSimulationSchema = new Schema({
  droneId: { type: String, required: true },
  baseline: {
    battery: { type: Number, default: 100 },
    speed: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },
    temperature: { type: Number, default: 25 },
  },
  simulated: {
    battery: { type: Number, default: 100 },
    speed: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },
    temperature: { type: Number, default: 25 },
  },
  variance: {
    battery: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
  },
  accuracy: { type: Number, min: 0, max: 100, default: 95 },
  lastSync: { type: Date, default: Date.now },
}, { _id: false });

const digitalTwinSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  simulationType: {
    type: String,
    enum: ['FLEET_WIDE', 'SINGLE_DRONE', 'ENVIRONMENTAL', 'DEMAND_FORECAST', 'STRESS_TEST'],
    default: 'FLEET_WIDE',
  },
  status: {
    type: String,
    enum: ['INITIALIZING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'],
    default: 'INITIALIZING',
  },
  drones: [droneSimulationSchema],
  parameters: {
    fleetSize: { type: Number, default: 50 },
    simulationDuration: { type: Number, default: 3600 }, // seconds
    weatherCondition: { type: String, default: 'CLEAR' },
    orderVolume: { type: Number, default: 100 },
    congestionLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    windSpeed: { type: Number, default: 0 },
    rainIntensity: { type: Number, min: 0, max: 100, default: 0 },
  },
  results: {
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    failedOrders: { type: Number, default: 0 },
    averageDeliveryTime: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    droneUtilization: { type: Number, min: 0, max: 100, default: 0 },
    collisionsDetected: { type: Number, default: 0 },
    weatherDelays: { type: Number, default: 0 },
    maintenanceCost: { type: Number, default: 0 },
  },
  events: [{
    timestamp: { type: Date, default: Date.now },
    type: { type: String }, // COLLISION, WEATHER_DELAY, MAINTENANCE, etc.
    description: { type: String },
    droneId: { type: String },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date },
  endTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('DigitalTwin', digitalTwinSchema);
