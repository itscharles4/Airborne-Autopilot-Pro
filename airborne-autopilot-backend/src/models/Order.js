const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
  customerName:     { type: String, required: true },
  customerEmail:    { type: String },
  pickupLocation:   { type: String, required: true },
  deliveryLocation: { type: String, required: true },
  pickupNode:       { type: Number, required: true },
  deliveryNode:     { type: Number, required: true },
  packageWeight:    { type: Number, required: true, max: 5 },
  packageType:      { type: String, enum: ['STANDARD', 'FRAGILE', 'MEDICAL'], default: 'STANDARD' },
  priority:         { type: String, enum: ['STANDARD', 'EXPRESS', 'MEDICAL'], default: 'STANDARD' },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'APPROACHING', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
  },
  price:            { type: Number },
  droneAssigned:    { type: String, ref: 'Drone', default: null },
  estimatedETA:     { type: String },
  path:             [{ type: Number }],
  totalDistance:    { type: Number },
  completedAt:      { type: Date },
  cancelReason:     { type: String },
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
