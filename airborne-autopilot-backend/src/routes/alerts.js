const express = require('express');
const router = express.Router();
const { getAlerts, resolveAlert, createAlert, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get   ('/',     authorize('alerts:read'),  getAlerts);
router.post  ('/',     authorize('alerts:write'), createAlert);
router.put   ('/:id/resolve', authorize('alerts:write'), resolveAlert);
router.delete('/:id',  authorize('alerts:write'), deleteAlert);

module.exports = router;
