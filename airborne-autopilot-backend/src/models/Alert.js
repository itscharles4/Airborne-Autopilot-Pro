const mongoose = require('mongoose');
const { Schema } = mongoose;

const alertSchema = new Schema({
  droneId:   { type: String, required: true },
  flightId:  { type: Schema.Types.ObjectId, ref: 'Flight' },
  orderId:   { type: Schema.Types.ObjectId, ref: 'Order' },
  type: {
    type: String,
    enum: ['COLLISION', 'BATTERY', 'WEATHER', 'SYSTEM', 'MAINTENANCE', 'GEOFENCE', 'SIGNAL_LOSS', 'TEMPERATURE', 'ANOMALY'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'],
    default: 'WARNING',
  },
  message:    { type: String, required: true },
  data:       { type: Schema.Types.Mixed },
  resolved:   { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  action:     { type: String }, // Action taken to resolve
  autoResolved: { type: Boolean, default: false },
  notified:   { type: Boolean, default: false },
  priority:   { type: Number, min: 1, max: 10, default: 5 },
  detectedAt: { type: Date, default: Date.now },
}, { timestamps: true });

alertSchema.index({ resolved: 1, createdAt: -1 });
alertSchema.index({ droneId: 1, resolved: 1 });

module.exports = mongoose.model('Alert', alertSchema);
