const Flight = require('../models/Flight');
const Drone = require('../models/Drone');

exports.getAllFlights = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, droneId } = req.query;
    const filter = droneId ? { droneId } : {};
    const flights = await Flight.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('orderId', 'customerName deliveryLocation status');
    res.json({ success: true, count: flights.length, data: flights });
  } catch (error) { next(error); }
};

exports.getFlightById = async (req, res, next) => {
  try {
    const flight = await Flight.findById(req.params.id).populate('orderId');
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
    res.json({ success: true, data: flight });
  } catch (error) { next(error); }
};

exports.getFlightReplay = async (req, res, next) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });

    // If real telemetry exists, return it
    if (flight.telemetry && flight.telemetry.length > 0) {
      return res.json({
        success: true,
        data: {
          flightId: flight._id,
          droneId: flight.droneId,
          totalTicks: flight.telemetry.length,
          ticks: flight.telemetry,
          events: flight.telemetry.filter(t => t.event).map(t => ({ tick: t.tick, type: t.event })),
        },
      });
    }

    // Generate 120-tick simulation matching frontend FlightReplay.tsx format
    const ticks = [];
    const events = [];
    let battery = 95;
    let x = 100, y = 100, z = 0;
    const vx = 2.5, vy = 2;

    for (let i = 0; i < 120; i++) {
      battery -= 0.05;
      x += vx * Math.sin(i * 0.08) + 0.5;
      y += vy * Math.cos(i * 0.06) + 0.4;
      z = i < 5 ? i * 10 : i > 115 ? (120 - i) * 10 : 50;

      let event = null;
      if (i === 10)              { event = 'TAKEOFF'; }
      if (i === 30)              { event = 'REROUTE'; }
      if (i === 60)              { event = 'COLLISION_WARNING'; }
      if (battery < 20 && !events.find(e => e.type === 'LOW_BATTERY')) { event = 'LOW_BATTERY'; }
      if (i === 119)             { event = 'LANDED'; }

      if (event) events.push({ tick: i, type: event });
      ticks.push({ tick: i, timestamp: new Date(Date.now() + i * 2000), x, y, z, battery: Math.round(battery * 100) / 100, event });
    }

    res.json({
      success: true,
      data: { flightId: flight._id, droneId: flight.droneId, totalTicks: 120, ticks, events },
    });
  } catch (error) { next(error); }
};

exports.getActiveFlights = async (req, res, next) => {
  try {
    const flights = await Flight.find({ status: { $in: ['FLYING', 'HOVERING', 'RETURN_TO_BASE'] } });
    res.json({ success: true, count: flights.length, data: flights });
  } catch (error) { next(error); }
};

exports.completeFlight = async (req, res, next) => {
  try {
    const flight = await Flight.findByIdAndUpdate(
      req.params.id,
      { status: 'LANDED', endTime: new Date(), progress: 100 },
      { new: true }
    );
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found' });
    res.json({ success: true, data: flight });
  } catch (error) { next(error); }
};
