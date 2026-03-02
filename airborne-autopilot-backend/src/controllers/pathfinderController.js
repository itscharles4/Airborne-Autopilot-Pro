const { dijkstra } = require('../algorithms/dijkstra');
const { nearestNeighborTSP, bruteForce } = require('../algorithms/tsp');
const CITY_GRAPH = require('../algorithms/graph');
const redis = require('../config/redis');

exports.computeDijkstra = async (req, res, next) => {
  try {
    const { start, end, avoid = [] } = req.body;
    if (start === undefined || end === undefined) {
      return res.status(400).json({ success: false, message: 'start and end nodes required' });
    }
    const cacheKey = `path:${start}:${end}:${avoid.sort().join('-')}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, cached: true, data: JSON.parse(cached) });

    const result = dijkstra(parseInt(start), parseInt(end), avoid.map(Number));
    if (!result) return res.status(404).json({ success: false, message: 'No path found' });

    result.startName = CITY_GRAPH.nodeNames[start];
    result.endName   = CITY_GRAPH.nodeNames[end];
    result.pathNames = result.path.map(n => CITY_GRAPH.nodeNames[n]);

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // cache 5 min
    res.json({ success: true, cached: false, data: result });
  } catch (error) { next(error); }
};

exports.computeTSP = async (req, res, next) => {
  try {
    const { stops, algorithm = 'auto' } = req.body;
    if (!stops || stops.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 stops required' });
    }
    const result = algorithm === 'brute' || stops.length <= 8
      ? bruteForce(stops.map(Number))
      : nearestNeighborTSP(stops.map(Number));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getGraph = async (req, res) => {
  const { nodeNames, coordinates, adjacencyList, noFlyZones } = CITY_GRAPH;
  const edges = [];
  adjacencyList.forEach((neighbors, u) => {
    neighbors.forEach(([v, w]) => {
      if (u < v) edges.push({ from: u, to: v, weight: w,
        fromName: nodeNames[u], toName: nodeNames[v],
        noFly: noFlyZones.has(u) || noFlyZones.has(v),
      });
    });
  });
  res.json({ success: true, data: { nodes: nodeNames.map((name,i) => ({ id:i, name, ...coordinates[i] })), edges, noFlyZones: [...noFlyZones] } });
};

exports.setNoFlyZone = async (req, res) => {
  const { nodes, action } = req.body; // action: 'add' | 'remove'
  nodes.forEach(n => {
    if (action === 'add')    CITY_GRAPH.noFlyZones.add(n);
    if (action === 'remove') CITY_GRAPH.noFlyZones.delete(n);
  });
  res.json({ success: true, message: `No-fly zones updated`, noFlyZones: [...CITY_GRAPH.noFlyZones] });
};
