const express = require('express');
const router = express.Router();
const { planMission, analyzeAirspace, getTemplates, deployMission } = require('../controllers/missionController');
const { generateMissionPlan, getDroneHealth, forecastDemand, detectAnomalies, optimizeFleet } = require('../controllers/aiMissionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Existing routes
router.post('/plan',             authorize('missions:write'), planMission);
router.post('/analyze-airspace', authorize('missions:write'), analyzeAirspace);
router.get ('/templates',        authorize('drones:read'),    getTemplates);
router.post('/deploy',           authorize('missions:write'), deployMission);

// AI-powered mission planning
router.post('/ai/plan',          authorize('missions:write'), generateMissionPlan);
router.get ('/ai/health/:droneId', authorize('drones:read'),  getDroneHealth);
router.get ('/ai/forecast',      authorize('analytics:read'), forecastDemand);
router.get ('/ai/anomalies',     authorize('analytics:read'), detectAnomalies);
router.post('/ai/optimize',      authorize('missions:write'), optimizeFleet);

module.exports = router;
