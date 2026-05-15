const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  customerName:     { type: String, required: true },
  customerEmail:    { type: String },
  customerPhone:    { type: String },
  pickupLocation:   { type: String, required: true },
  deliveryLocation: { type: String, required: true },
  pickupNode:       { type: Number, required: true },
  deliveryNode:     { type: Number, required: true },
  pickupCoords:     { lat: Number, lng: Number },
  deliveryCoords:   { lat: Number, lng: Number },
  packageWeight:    { type: Number, required: true, max: 5 },
  packageType:      { type: String, enum: ['STANDARD', 'FRAGILE', 'MEDICAL'], default: 'STANDARD' },
  priority:         { type: String, enum: ['STANDARD', 'EXPRESS', 'URGENT', 'MEDICAL'], default: 'STANDARD' },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'APPROACHING', 'DELIVERED', 'CANCELLED', 'FAILED'],
    default: 'PENDING',
  },
  placedAt:         { type: Date, default: Date.now },
  deliveredAt:      { type: Date, default: null },
  price:            { type: Number },
  cost:             { type: Number, default: 0 },
  profit:           { type: Number, default: 0 },
  priceLock:        { type: Number, default: null },
  confirmedAt:      { type: Date, default: null },
  droneAssigned:    { type: String, ref: 'Drone', default: null },
  flightId:         { type: Schema.Types.ObjectId, ref: 'Flight', default: null },
  estimatedETA:     { type: Date },
  actualETA:        { type: Date },
  path:             [{ type: Number }],
  totalDistance:    { type: Number },
  completedAt:      { type: Date },
  cancelReason:     { type: String },
  // Enhanced fields
  notes:            { type: String },
  specialHandling:  { type: String },
  customerRating:   { type: Number, min: 1, max: 5 },
  failureReason:    { type: String },
  attempts:         { type: Number, default: 1 },
  proofOfDelivery:  { type: String },
  signature:        { type: String },
  weatherDelay:     { type: Boolean, default: false },
  droneChangeReason: { type: String },
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.price) {
    const base = 50;
    const weightFee = this.packageWeight * 10;
    const priorityFee = this.priority === 'MEDICAL' ? 100 : this.priority === 'EXPRESS' ? 50 : 0;
    this.price = base + weightFee + priorityFee;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
