const Alert = require('../models/Alert');

exports.getAlerts = async (req, res, next) => {
  try {
    const { droneId, resolved = 'false', severity } = req.query;
    const filter = {};
    if (droneId)  filter.droneId  = droneId;
    if (severity) filter.severity = severity;
    filter.resolved = resolved === 'true';
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) { next(error); }
};

exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date(), resolvedBy: req.user.name },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.createAlert = async (req, res, next) => {
  try {
    const alert = await Alert.create(req.body);
    const io = req.app.get('io');
    if (io) io.emit('drone:alert', { ...alert.toObject() });
    res.status(201).json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.deleteAlert = async (req, res, next) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.status(204).json({ success: true, data: null });
  } catch (error) { next(error); }
};
