const { dijkstra } = require('./dijkstra');
const CITY_GRAPH = require('./graph');

// Nearest Neighbor Heuristic for TSP
function nearestNeighborTSP(stops, startNode = 0) {
  if (stops.length === 0) return { stops: [], totalDistance: 0, segments: [] };
  if (stops.length === 1) return { stops, totalDistance: 0, segments: [] };

  const unvisited = new Set(stops);
  const tour = [startNode];
  let current = startNode;
  let totalDistance = 0;
  const segments = [];

  while (unvisited.size > 0) {
    let nearest = null;
    let nearestDist = Infinity;
    let nearestPath = null;

    for (const stop of unvisited) {
      const result = dijkstra(current, stop);
      if (result && result.totalDistance < nearestDist) {
        nearest = stop;
        nearestDist = result.totalDistance;
        nearestPath = result;
      }
    }

    if (nearest === null) break;

    unvisited.delete(nearest);
    tour.push(nearest);
    totalDistance += nearestDist;
    segments.push({
      from: current,
      to: nearest,
      path: nearestPath.path,
      distance: nearestDist,
      waypoints: nearestPath.waypoints,
    });
    current = nearest;
  }

  return {
    tour,
    totalDistance: Math.round(totalDistance * 100) / 100,
    segments,
    estimatedTime: Math.round(totalDistance * 28),
    algorithm: 'Nearest-Neighbor TSP',
    nodeNames: tour.map(n => CITY_GRAPH.nodeNames[n]),
  };
}

// Brute force for small inputs (≤ 8 stops)
function bruteForce(stops) {
  if (stops.length > 8) return nearestNeighborTSP(stops);

  const permute = (arr) => {
    if (arr.length <= 1) return [arr];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const perm of permute(rest)) result.push([arr[i], ...perm]);
    }
    return result;
  };

  const perms = permute(stops);
  let bestTour = null, bestDist = Infinity;

  for (const perm of perms) {
    let dist = 0;
    for (let i = 0; i < perm.length - 1; i++) {
      const result = dijkstra(perm[i], perm[i + 1]);
      if (!result) { dist = Infinity; break; }
      dist += result.totalDistance;
    }
    if (dist < bestDist) { bestDist = dist; bestTour = perm; }
  }

  return nearestNeighborTSP(bestTour || stops);
}

module.exports = { nearestNeighborTSP, bruteForce };
