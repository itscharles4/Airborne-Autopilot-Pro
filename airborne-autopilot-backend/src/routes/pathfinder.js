const express = require('express');
const router = express.Router();
const { computeDijkstra, computeTSP, getGraph, setNoFlyZone } = require('../controllers/pathfinderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.post('/dijkstra',      authorize('pathfinder:use'), computeDijkstra);
router.post('/tsp',           authorize('pathfinder:use'), computeTSP);
router.get ('/graph',         authorize('drones:read'),    getGraph);
router.put ('/graph/nofly',   authorize('drones:write'),   setNoFlyZone);

module.exports = router;
