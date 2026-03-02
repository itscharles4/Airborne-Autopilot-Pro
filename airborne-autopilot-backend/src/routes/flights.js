const express = require('express');
const router = express.Router();
const { getAllFlights, getFlightById, getFlightReplay, getActiveFlights, completeFlight } = require('../controllers/flightController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/',           authorize('flights:read'), getAllFlights);
router.get('/active',     authorize('flights:read'), getActiveFlights);
router.get('/:id',        authorize('flights:read'), getFlightById);
router.get('/:id/replay', authorize('flights:read'), getFlightReplay);
router.put('/:id/complete',authorize('flights:read'),completeFlight);

module.exports = router;
