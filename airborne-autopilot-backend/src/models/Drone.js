const mongoose = require('mongoose');
const { Schema } = mongoose;

const positionSchema = new Schema({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  z: { type: Number, default: 0 },
}, { _id: false });

const droneSchema = new Schema({
  id:             { type: String, required: true, unique: true },
  name:           { type: String, required: true },
  model:          { type: String, default: 'DJI Mavic 3' },
  status: {
    type: String,
    enum: ['IDLE', 'FLYING', 'CHARGING', 'MAINTENANCE', 'EMERGENCY'],
    default: 'IDLE',
  },
  battery:        { type: Number, min: 0, max: 100, default: 100 },
  position:       { type: positionSchema, default: () => ({ x: 0, y: 0, z: 0 }) },
  speed:          { type: Number, default: 0 },
  maxAltitude:    { type: Number, default: 120 },
  flightHours:    { type: Number, default: 0 },
  errorRate:      { type: Number, default: 0 },
  stability:      { type: Number, default: 100 },
  lastMaintenance:{ type: Date, default: Date.now },
  assignedOrder:  { type: Schema.Types.ObjectId, ref: 'Order', default: null },
  chargingStation:{ type: String, default: 'Station-A' },
}, { timestamps: true });

droneSchema.methods.getHealthScore = function () {
  const batteryScore    = (this.battery / 100) * 35;
  const maintenanceScore= (1 - Math.min(this.flightHours / 100, 1)) * 30;
  const errorScore      = (1 - Math.min(this.errorRate / 100, 1)) * 20;
  const stabilityScore  = (this.stability / 100) * 15;
  const total = Math.round(batteryScore + maintenanceScore + errorScore + stabilityScore);
  let grade = 'F';
  if (total >= 90) grade = 'A';
  else if (total >= 75) grade = 'B';
  else if (total >= 60) grade = 'C';
  else if (total >= 40) grade = 'D';
  return { score: total, grade };
};

module.exports = mongoose.model('Drone', droneSchema);
