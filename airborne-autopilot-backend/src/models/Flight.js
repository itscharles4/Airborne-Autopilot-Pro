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
  event:     { type: String, default: null },
}, { _id: false });

const flightSchema = new Schema({
  droneId:    { type: String, required: true },
  orderId:    { type: Schema.Types.ObjectId, ref: 'Order' },
  status: {
    type: String,
    enum: ['PRE_FLIGHT', 'FLYING', 'HOVERING', 'RETURN_TO_BASE', 'LANDED', 'ABORTED'],
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
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
