const express = require('express');
const router = express.Router();
const { getSummary, getDroneSummary, getCostBreakdown, getDailyData, exportCSV } = require('../controllers/revenueController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/summary',  authorize('revenue:read'), getSummary);
router.get('/drones',   authorize('revenue:read'), getDroneSummary);
router.get('/costs',    authorize('revenue:read'), getCostBreakdown);
router.get('/daily',    authorize('revenue:read'), getDailyData);
router.get('/export',   authorize('revenue:read'), exportCSV);

module.exports = router;
