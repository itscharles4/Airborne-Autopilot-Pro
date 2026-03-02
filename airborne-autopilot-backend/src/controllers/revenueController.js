const Revenue = require('../models/Revenue');
const Order = require('../models/Order');

exports.getSummary = async (req, res, next) => {
  try {
    const { period = 'weekly' } = req.query;
    const days = period === 'monthly' ? 30 : 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const prevStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      Revenue.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: null, revenue: { $sum: '$amount' }, cost: { $sum: '$cost' }, profit: { $sum: '$profit' }, count: { $sum: 1 } } },
      ]),
      Revenue.aggregate([
        { $match: { createdAt: { $gte: prevStart, $lt: startDate } } },
        { $group: { _id: null, revenue: { $sum: '$amount' }, cost: { $sum: '$cost' }, profit: { $sum: '$profit' }, count: { $sum: 1 } } },
      ]),
    ]);

    const cur = current[0] || { revenue: 0, cost: 0, profit: 0, count: 0 };
    const prev = previous[0] || { revenue: 1, cost: 1, profit: 1, count: 1 };

    res.json({
      success: true,
      data: {
        totalRevenue:    Math.round(cur.revenue),
        totalCost:       Math.round(cur.cost),
        netProfit:       Math.round(cur.profit),
        totalDeliveries: cur.count,
        profitMargin:    cur.revenue ? Math.round((cur.profit / cur.revenue) * 100) : 0,
        revenueGrowth:   prev.revenue ? Math.round(((cur.revenue - prev.revenue) / prev.revenue) * 100) : 0,
        deliveryGrowth:  prev.count   ? Math.round(((cur.count - prev.count) / prev.count) * 100) : 0,
      },
    });
  } catch (error) { next(error); }
};

exports.getDroneSummary = async (req, res, next) => {
  try {
    const data = await Revenue.aggregate([
      { $group: {
        _id: '$droneId',
        revenue:   { $sum: '$amount' },
        cost:      { $sum: '$cost' },
        profit:    { $sum: '$profit' },
        deliveries:{ $sum: 1 },
      }},
      { $sort: { revenue: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

exports.getCostBreakdown = async (req, res, next) => {
  try {
    const data = await Revenue.aggregate([
      { $group: {
        _id: null,
        battery:     { $sum: '$costBreakdown.battery' },
        maintenance: { $sum: '$costBreakdown.maintenance' },
        depreciation:{ $sum: '$costBreakdown.depreciation' },
        operations:  { $sum: '$costBreakdown.operations' },
      }},
    ]);
    res.json({ success: true, data: data[0] || {} });
  } catch (error) { next(error); }
};

exports.getDailyData = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const data = await Revenue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue:    { $sum: '$amount' },
        cost:       { $sum: '$cost' },
        profit:     { $sum: '$profit' },
        deliveries: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

exports.exportCSV = async (req, res, next) => {
  try {
    const revenues = await Revenue.find().sort({ createdAt: -1 }).limit(500).populate('orderId', 'customerName deliveryLocation');
    const header = 'Date,OrderID,DroneID,Customer,Amount,Cost,Profit\n';
    const rows = revenues.map(r =>
      `${r.createdAt.toISOString().split('T')[0]},${r.orderId?._id || ''},${r.droneId},${r.orderId?.customerName || ''},${r.amount},${r.cost},${r.profit}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=revenue_report.csv');
    res.send(header + rows);
  } catch (error) { next(error); }
};
