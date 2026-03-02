const express = require('express');
const router = express.Router();
const {
  getAllOrders, getOrderById, createOrder, cancelOrder,
  trackOrder, getOrderHistory, completeOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get   ('/',              authorize('orders:read'),  getAllOrders);
router.post  ('/',              authorize('orders:write'), createOrder);
router.get   ('/:id',           authorize('orders:read'),  getOrderById);
router.get   ('/:id/track',     authorize('orders:read'),  trackOrder);
router.put   ('/:id/cancel',    authorize('orders:write'), cancelOrder);
router.put   ('/:id/complete',  authorize('orders:write'), completeOrder);
router.get   ('/history/all',   authorize('orders:read'),  getOrderHistory);

module.exports = router;
