const CITY_GRAPH = require('./graph');

class MinHeap {
  constructor() { this.heap = []; }

  push(node, dist) {
    this.heap.push({ node, dist });
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  isEmpty() { return this.heap.length === 0; }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].dist <= this.heap[idx].dist) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  _sinkDown(idx) {
    const n = this.heap.length;
    while (true) {
      let smallest = idx;
      const l = 2 * idx + 1, r = 2 * idx + 2;
      if (l < n && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < n && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

function dijkstra(start, end, avoidNodes = []) {
  const graph = CITY_GRAPH;
  const n = graph.numNodes;
  const dist = Array(n).fill(Infinity);
  const prev = Array(n).fill(-1);
  const visited = new Set();
  const avoidSet = new Set([...avoidNodes, ...graph.noFlyZones]);

  dist[start] = 0;
  const heap = new MinHeap();
  heap.push(start, 0);

  while (!heap.isEmpty()) {
    const { node: u } = heap.pop();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === end) break;

    for (const [v, weight] of graph.adjacencyList[u]) {
      if (avoidSet.has(v) && v !== end) continue;
      const alt = dist[u] + weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
        heap.push(v, alt);
      }
    }
  }

  if (dist[end] === Infinity) return null;

  // Reconstruct path
  const path = [];
  let current = end;
  while (current !== -1) {
    path.unshift(current);
    current = prev[current];
  }

  const waypoints = path.map(node => graph.coordinates[node]);

  return {
    path,
    totalDistance: dist[end],
    waypoints,
    estimatedTime: Math.round(dist[end] * 28),  // ~28 seconds per unit
    nodesExplored: visited.size,
    algorithm: 'Dijkstra',
  };
}

module.exports = { dijkstra, MinHeap };
