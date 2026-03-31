const Order = require('../models/Order');
const Drone = require('../models/Drone');
const Flight = require('../models/Flight');
const Revenue = require('../models/Revenue');
const { dijkstra } = require('../algorithms/dijkstra');
const { PriceCalculator } = require('../services/priceCalculator');
const { geocodeAddress, isServiceHours } = require('../utils/serviceUtils');
const { orderQueue } = require('../utils/priorityQueue');

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, count: orders.length, total, page: parseInt(page), data: orders });
  } catch (error) { next(error); }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.calculatePrice = async (req, res, next) => {
  try {
    const { pickup_node, delivery_node, delivery_address, priority } = req.body;
    if (pickup_node === undefined || (!delivery_node && !delivery_address) || !priority) {
      return res.status(400).json({ error: 'pickup_node, delivery_node or delivery_address, and priority are required' });
    }

    const pickupNode = Number(pickup_node);
    const deliveryNodeResolved = delivery_node !== undefined ? Number(delivery_node) : geocodeAddress(delivery_address);
    if (isNaN(pickupNode) || (deliveryNodeResolved === null || deliveryNodeResolved === undefined || isNaN(Number(deliveryNodeResolved)))) {
      return res.status(404).json({ error: 'Address not serviceable' });
    }

    const price = PriceCalculator.calculate_price(pickupNode, Number(deliveryNodeResolved), priority);
    const distance = PriceCalculator.calculate_distance(pickupNode, Number(deliveryNodeResolved));
    const eta_minutes = Math.max(10, Math.round(distance * 2));

    return res.status(200).json({ price, distance, eta_minutes });
  } catch (error) {
    if (error.message === 'No path found') {
      return res.status(404).json({ error: 'Address not serviceable' });
    }
    if (error.message === 'Price calculation timeout') {
      return res.status(500).json({ error: 'Service temporarily unavailable' });
    }
    next(error);
  }
};

exports.confirmOrder = async (req, res, next) => {
  const session = await Order.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!['PENDING', 'ASSIGNED'].includes(order.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Cannot confirm order in current status' });
    }

    order.status = 'ASSIGNED';
    order.priceLock = order.price;
    order.confirmedAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

const PRIORITY_MULTIPLIER = {
  STANDARD: 1.0,
  EXPRESS: 1.25,
  URGENT: 1.5,
};

exports.createOrder = async (req, res, next) => {
  try {
    const {
      pickup_node,
      delivery_address,
      package_size,
      priority,
      package_weight,
      pickupNode,
      deliveryNode,
      customerName,
      customerEmail,
    } = req.body;

    const pickup = pickup_node ?? pickupNode;
    const deliveryAddress = delivery_address ?? delivery_address;

    if (pickup === undefined || !deliveryAddress || !package_size || !priority) {
      return res.status(400).json({ error: 'pickup_node and delivery_address are required' });
    }

    if (package_weight !== undefined && Number(package_weight) > 5) {
      return res.status(400).json({ error: 'Package exceeds maximum weight limit of 5kg' });
    }

    if (priority !== 'URGENT' && !isServiceHours()) {
      return res.status(400).json({ error: 'Orders accepted only between 6am and 10pm' });
    }

    const deliveryNodeResolved = deliveryNode !== undefined ? deliveryNode : geocodeAddress(deliveryAddress);
    if (deliveryNodeResolved === null || deliveryNodeResolved === undefined) {
      return res.status(404).json({ error: 'Address not serviceable' });
    }

    if (pickup < 0 || pickup >= 20 || deliveryNodeResolved < 0 || deliveryNodeResolved >= 20) {
      return res.status(404).json({ error: 'Address not serviceable' });
    }

    const pathResult = dijkstra(pickup, deliveryNodeResolved);
    if (!pathResult) {
      return res.status(404).json({ error: 'Address not serviceable' });
    }

    const distance = PriceCalculator.calculate_distance(pickup, deliveryNodeResolved);
    const price = PriceCalculator.calculate_price(pickup, deliveryNodeResolved, priority);
    const etaMinutes = Math.max(10, Math.round(distance * 2));

    const order = await Order.create({
      customerName: customerName || 'anonymous',
      customerEmail: customerEmail || 'unknown@example.com',
      pickupLocation: `node:${pickup}`,
      deliveryLocation: deliveryAddress,
      pickupNode: pickup,
      deliveryNode: deliveryNodeResolved,
      packageWeight: Number(package_weight || 1),
      priority,
      packageType: package_size,
      status: 'PENDING',
      price,
      totalDistance: distance,
      path: pathResult.path,
      estimatedETA: `${etaMinutes} minutes`,
      placedAt: new Date(),
    });

    const priorityScore = priority === 'URGENT' ? 1 : priority === 'EXPRESS' ? 2 : 3;
    orderQueue.push(order._id.toString(), priorityScore);

    const io = req.app.get('io');
    if (io) io.emit('order:created', { orderId: order._id, status: order.status });

    return res.status(200).json({
      order_id: order._id,
      price,
      eta_minutes: etaMinutes,
      status: 'PENDING',
      placed_at: order.placedAt.toISOString(),
    });
  } catch (error) {
    console.error('createOrder error', error);
    return res.status(500).json({ error: 'Service temporarily unavailable' });
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['PENDING', 'ASSIGNED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order in transit' });
    }
    if (order.droneAssigned) {
      await Drone.findOneAndUpdate({ id: order.droneAssigned }, { status: 'IDLE', assignedOrder: null });
    }
    order.status = 'CANCELLED';
    order.cancelReason = req.body.reason || 'Customer cancelled';
    await order.save();
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const drone = order.droneAssigned
      ? await Drone.findOne({ id: order.droneAssigned })
      : null;
    res.json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        droneId: order.droneAssigned,
        dronePosition: drone?.position,
        droneBattery: drone?.battery,
        estimatedETA: order.estimatedETA,
        path: order.path,
      },
    });
  } catch (error) { next(error); }
};

exports.getOrderHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'DELIVERED' }).sort({ completedAt: -1 }).limit(50);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) { next(error); }
};

exports.completeOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'DELIVERED';
    order.completedAt = new Date();
    await order.save();

    if (order.droneAssigned) {
      await Drone.findOneAndUpdate(
        { id: order.droneAssigned },
        { status: 'IDLE', assignedOrder: null, $inc: { flightHours: 0.5 } }
      );
    }

    // Record revenue
    const cost = (order.price || 0) * 0.4;
    await Revenue.create({
      orderId: order._id,
      droneId: order.droneAssigned || 'unknown',
      amount: order.price || 0,
      cost,
      costBreakdown: {
        battery: cost * 0.3,
        maintenance: cost * 0.25,
        depreciation: cost * 0.2,
        operations: cost * 0.25,
      },
    });

    const io = req.app.get('io');
    if (io) io.emit('order:status', { orderId: order._id, status: 'DELIVERED' });

    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};
