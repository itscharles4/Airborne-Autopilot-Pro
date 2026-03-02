const express = require('express');
const router = express.Router();
const { planMission, analyzeAirspace, getTemplates, deployMission } = require('../controllers/missionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.post('/plan',             authorize('missions:write'), planMission);
router.post('/analyze-airspace', authorize('missions:write'), analyzeAirspace);
router.get ('/templates',        authorize('drones:read'),    getTemplates);
router.post('/deploy',           authorize('missions:write'), deployMission);

module.exports = router;
