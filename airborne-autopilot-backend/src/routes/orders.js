const express = require('express');
const router = express.Router();
const {
  getAllOrders, getOrderById, createOrder, cancelOrder,
  trackOrder, getOrderHistory, completeOrder, calculatePrice, confirmOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get   ('/',              authorize('orders:read'),  getAllOrders);
router.post  ('/calculate-price', authorize('orders:read'), calculatePrice);
router.post  ('/',              authorize('orders:write'), createOrder);
router.get   ('/:id',           authorize('orders:read'),  getOrderById);
router.post  ('/:id/confirm',   authorize('orders:write'), confirmOrder);
router.get   ('/:id/track',     authorize('orders:read'),  trackOrder);
router.put   ('/:id/cancel',    authorize('orders:write'), cancelOrder);
router.put   ('/:id/complete',  authorize('orders:write'), completeOrder);
router.get   ('/history/all',   authorize('orders:read'),  getOrderHistory);

module.exports = router;
