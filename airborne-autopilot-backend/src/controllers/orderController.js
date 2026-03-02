const Order = require('../models/Order');
const Drone = require('../models/Drone');
const Flight = require('../models/Flight');
const Revenue = require('../models/Revenue');
const { dijkstra } = require('../algorithms/dijkstra');

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

exports.createOrder = async (req, res, next) => {
  try {
    const { customerName, customerEmail, pickupLocation, deliveryLocation,
            pickupNode, deliveryNode, packageWeight, priority, packageType } = req.body;

    // Compute path immediately on order creation
    const pathResult = dijkstra(pickupNode, deliveryNode);
    if (!pathResult) {
      return res.status(400).json({ success: false, message: 'No valid path exists between these locations' });
    }

    const order = await Order.create({
      customerName, customerEmail, pickupLocation, deliveryLocation,
      pickupNode, deliveryNode, packageWeight, priority, packageType,
      path: pathResult.path,
      totalDistance: pathResult.totalDistance,
      estimatedETA: `${Math.round(pathResult.estimatedTime / 60)} minutes`,
    });

    // Auto-assign nearest available drone
    const drone = await Drone.findOne({ status: 'IDLE', battery: { $gte: 30 } }).sort({ battery: -1 });
    if (drone) {
      order.droneAssigned = drone.id;
      order.status = 'ASSIGNED';
      drone.status = 'FLYING';
      drone.assignedOrder = order._id;
      await Promise.all([order.save(), drone.save()]);

      // Create flight record
      await Flight.create({
        droneId: drone.id,
        orderId: order._id,
        path: pathResult.path,
        waypoints: pathResult.waypoints,
        totalDistance: pathResult.totalDistance,
        startTime: new Date(),
        status: 'FLYING',
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('order:status', { orderId: order._id, status: order.status, droneId: order.droneAssigned });

    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
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
