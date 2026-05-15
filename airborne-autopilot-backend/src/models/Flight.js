const mongoose = require('mongoose');
const { Schema } = mongoose;

const telemetryTickSchema = new Schema({
  tick:      { type: Number },
  timestamp: { type: Date, default: Date.now },
  x:         { type: Number },
  y:         { type: Number },
  z:         { type: Number },
  battery:   { type: Number },
  speed:     { type: Number, default: 0 },
  temperature: { type: Number, default: 25 },
  signalStrength: { type: Number, default: 100 },
  altitude:  { type: Number, default: 0 },
  heading:   { type: Number, default: 0 },
  event:     { type: String, default: null },
}, { _id: false });

const flightSchema = new Schema({
  droneId:    { type: String, required: true },
  orderId:    { type: Schema.Types.ObjectId, ref: 'Order' },
  status: {
    type: String,
    enum: ['PRE_FLIGHT', 'FLYING', 'HOVERING', 'RETURN_TO_BASE', 'LANDED', 'ABORTED', 'REROUTING'],
    default: 'PRE_FLIGHT',
  },
  progress:      { type: Number, default: 0, min: 0, max: 100 },
  currentNode:   { type: Number, default: 0 },
  path:          [{ type: Number }],
  waypoints:     [{ x: Number, y: Number, z: Number }],
  telemetry:     [telemetryTickSchema],
  totalDistance: { type: Number, default: 0 },
  duration:      { type: Number, default: 0 },
  startTime:     { type: Date },
  endTime:       { type: Date },
  reroutes:      { type: Number, default: 0 },
  // Enhanced fields
  estimatedArrival: { type: Date },
  actualArrival:    { type: Date },
  batteryConsumed:  { type: Number, default: 0 },
  distanceTraveled: { type: Number, default: 0 },
  avgSpeed:         { type: Number, default: 0 },
  maxSpeed:         { type: Number, default: 0 },
  minBattery:       { type: Number, default: 100 },
  maxAltitude:      { type: Number, default: 0 },
  windSpeed:        { type: Number, default: 0 },
  weatherCondition: { type: String, default: 'CLEAR' },
  rerouteReason:    [{ type: String }],
  anomalies:        [{ type: String }],
  pilotOverrides:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
