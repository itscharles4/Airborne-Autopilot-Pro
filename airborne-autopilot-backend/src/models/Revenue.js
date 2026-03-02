const mongoose = require('mongoose');
const { Schema } = mongoose;

const revenueSchema = new Schema({
  orderId:    { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  droneId:    { type: String, required: true },
  amount:     { type: Number, required: true },
  cost:       { type: Number, required: true },
  profit:     { type: Number },
  costBreakdown: {
    battery:     { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 },
    depreciation:{ type: Number, default: 0 },
    operations:  { type: Number, default: 0 },
  },
  date:       { type: Date, default: Date.now },
}, { timestamps: true });

revenueSchema.pre('save', function (next) {
  this.profit = this.amount - this.cost;
  next();
});

module.exports = mongoose.model('Revenue', revenueSchema);
