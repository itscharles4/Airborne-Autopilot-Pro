const mongoose = require('mongoose');
const { Schema } = mongoose;

const geofenceSchema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['NO_FLY_ZONE', 'RESTRICTED_ZONE', 'SLOW_ZONE', 'CHARGING_STATION'],
    default: 'NO_FLY_ZONE',
  },
  coordinates: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  }],
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  radius: { type: Number, default: 500 }, // meters
  minAltitude: { type: Number, default: 0 },
  maxAltitude: { type: Number, default: 500 },
  description: { type: String },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'HIGH',
  },
  active: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date },
  endDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Geofence', geofenceSchema);
