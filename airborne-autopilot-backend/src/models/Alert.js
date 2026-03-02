const mongoose = require('mongoose');
const { Schema } = mongoose;

const alertSchema = new Schema({
  droneId:   { type: String, required: true },
  type: {
    type: String,
    enum: ['COLLISION', 'BATTERY', 'WEATHER', 'SYSTEM', 'MAINTENANCE'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'WARNING',
  },
  message:    { type: String, required: true },
  data:       { type: Schema.Types.Mixed },
  resolved:   { type: Boolean, default: false },
  resolvedAt: { type: Date },
  resolvedBy: { type: String },
}, { timestamps: true });

alertSchema.index({ resolved: 1, createdAt: -1 });
alertSchema.index({ droneId: 1, resolved: 1 });

module.exports = mongoose.model('Alert', alertSchema);
