const express = require('express');
const router = express.Router();
const {
  getAllDrones, getDroneById, createDrone, updateDrone,
  deleteDrone, getDroneHealth, getAvailableDrones, sendCommand,
} = require('../controllers/droneController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get   ('/',            authorize('drones:read'),  getAllDrones);
router.get   ('/available',   authorize('drones:read'),  getAvailableDrones);
router.get   ('/:id',         authorize('drones:read'),  getDroneById);
router.post  ('/',            authorize('drones:write'), createDrone);
router.put   ('/:id',         authorize('drones:write'), updateDrone);
router.delete('/:id',         authorize('drones:write'), deleteDrone);
router.get   ('/:id/health',  authorize('drones:read'),  getDroneHealth);
router.post  ('/:id/command', authorize('drones:write'), sendCommand);

module.exports = router;
