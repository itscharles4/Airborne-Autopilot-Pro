/**
 * Advanced Pathfinding & Optimization Algorithms
 * Includes A*, Dijkstra, Genetic Algorithm, Ant Colony Optimization
 */

export interface Point { x: number; y: number; }
export interface PathNode extends Point { id: string; cost: number; heuristic: number; }
export interface Obstacle { x: number; y: number; radius: number; }

// ========== A* PATHFINDING ==========
export class AStarPathfinder {
  private grid: boolean[][];
  private cellSize: number;

  constructor(gridWidth: number, gridHeight: number, cellSize: number = 10) {
    this.cellSize = cellSize;
    this.grid = Array(Math.ceil(gridHeight / cellSize))
      .fill(null)
      .map(() => Array(Math.ceil(gridWidth / cellSize)).fill(false));
  }

  addObstacle(x: number, y: number, radius: number) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    const cellRadius = Math.ceil(radius / this.cellSize);

    for (let i = cellX - cellRadius; i <= cellX + cellRadius; i++) {
      for (let j = cellY - cellRadius; j <= cellY + cellRadius; j++) {
        if (i >= 0 && i < this.grid[0].length && j >= 0 && j < this.grid.length) {
          this.grid[j][i] = true;
        }
      }
    }
  }

  findPath(start: Point, end: Point, maxTime: number = 5000): Point[] {
    const startTime = Date.now();
    const openSet = new Set<string>();
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    const heuristic = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
    const key = (p: Point) => `${Math.round(p.x)},${Math.round(p.y)}`;

    const startKey = key(start);
    openSet.add(startKey);
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start, end));

    while (openSet.size > 0 && Date.now() - startTime < maxTime) {
      let current: Point | null = null;
      let lowestF = Infinity;

      for (const k of openSet) {
        const score = fScore.get(k) || Infinity;
        if (score < lowestF) {
          lowestF = score;
          const [x, y] = k.split(",").map(Number);
          current = { x, y };
        }
      }

      if (!current) break;
      if (Math.hypot(current.x - end.x, current.y - end.y) < 15) {
        return this.reconstructPath(cameFrom, current, start);
      }

      const currentKey = key(current);
      openSet.delete(currentKey);

      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = key(neighbor);
        const tentativeG = (gScore.get(currentKey) || 0) + heuristic(current, neighbor);

        if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, currentKey);
          gScore.set(neighborKey, tentativeG);
          fScore.set(neighborKey, tentativeG + heuristic(neighbor, end));
          openSet.add(neighborKey);
        }
      }
    }

    return [start]; // No path found
  }

  private getNeighbors(point: Point): Point[] {
    const neighbors: Point[] = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const newX = point.x + dx * 10;
      const newY = point.y + dy * 10;
      neighbors.push({ x: newX, y: newY });
    }
    return neighbors;
  }

  private reconstructPath(cameFrom: Map<string, string>, current: Point, start: Point): Point[] {
    const path: Point[] = [current];
    let currentKey = `${Math.round(current.x)},${Math.round(current.y)}`;

    while (cameFrom.has(currentKey)) {
      const prevKey = cameFrom.get(currentKey)!;
      const [x, y] = prevKey.split(",").map(Number);
      path.unshift({ x, y });
      currentKey = prevKey;
    }
    return path;
  }
}

// ========== GENETIC ALGORITHM FOR TSP ==========
export interface Individual {
  route: number[];
  fitness: number;
}

export class GeneticAlgorithmTSP {
  private population: Individual[] = [];
  private populationSize: number;
  private mutationRate: number;
  private generationLimit: number;

  constructor(populationSize = 50, mutationRate = 0.02, generationLimit = 200) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.generationLimit = generationLimit;
  }

  solve(distances: number[][]): number[] {
    const n = distances.length;
    this.population = this.initializePopulation(n);

    for (let gen = 0; gen < this.generationLimit; gen++) {
      // Evaluate fitness
      this.population = this.population.map(ind => ({
        ...ind,
        fitness: this.calculateFitness(ind.route, distances)
      }));

      // Sort by fitness
      this.population.sort((a, b) => b.fitness - a.fitness);

      // Selection and crossover
      const newPopulation: Individual[] = [];
      for (let i = 0; i < this.populationSize / 2; i++) {
        const parent1 = this.population[i].route;
        const parent2 = this.population[i + Math.floor(this.populationSize / 2)].route;
        const child = this.crossover(parent1, parent2);
        newPopulation.push({ route: child, fitness: 0 });
      }

      // Mutation
      for (const ind of newPopulation) {
        if (Math.random() < this.mutationRate) {
          ind.route = this.mutate(ind.route);
        }
      }

      this.population = newPopulation;
    }

    // Return best route
    return this.population.reduce((best, ind) => {
      const bestFitness = this.calculateFitness(best, distances);
      const indFitness = this.calculateFitness(ind.route, distances);
      return indFitness > bestFitness ? ind.route : best;
    });
  }

  private initializePopulation(n: number): Individual[] {
    const pop: Individual[] = [];
    for (let i = 0; i < this.populationSize; i++) {
      const route = Array.from({ length: n }, (_, i) => i);
      route.sort(() => Math.random() - 0.5);
      pop.push({ route, fitness: 0 });
    }
    return pop;
  }

  private calculateFitness(route: number[], distances: number[][]): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length; i++) {
      const from = route[i];
      const to = route[(i + 1) % route.length];
      totalDistance += distances[from][to];
    }
    return 1 / totalDistance; // Inverse for fitness (higher is better)
  }

  private crossover(parent1: number[], parent2: number[]): number[] {
    const n = parent1.length;
    const start = Math.floor(Math.random() * n);
    const end = Math.floor(Math.random() * n);
    const [a, b] = [start, end].sort((x, y) => x - y);

    const child: number[] = new Array(n).fill(-1);
    for (let i = a; i < b; i++) {
      child[i] = parent1[i];
    }

    let pos = b;
    for (let i = 0; i < n; i++) {
      if (!child.includes(parent2[i])) {
        if (pos === n) pos = 0;
        child[pos++] = parent2[i];
      }
    }
    return child;
  }

  private mutate(route: number[]): number[] {
    const copy = [...route];
    const i = Math.floor(Math.random() * copy.length);
    const j = Math.floor(Math.random() * copy.length);
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  }
}

// ========== ANT COLONY OPTIMIZATION ==========
export class AntColonyOptimization {
  private pheromone: number[][] = [];
  private distanceMatrix: number[][] = [];
  private alpha = 0.5;
  private beta = 1.5;
  private evaporationRate = 0.1;
  private numAnts: number;
  private iterations: number;

  constructor(distanceMatrix: number[][], numAnts = 30, iterations = 100) {
    this.distanceMatrix = distanceMatrix;
    this.numAnts = numAnts;
    this.iterations = iterations;
    this.initPheromone();
  }

  private initPheromone() {
    const n = this.distanceMatrix.length;
    const initialPheromone = 1 / n;
    this.pheromone = Array(n)
      .fill(null)
      .map(() => Array(n).fill(initialPheromone));
  }

  solve(): number[] {
    let bestRoute = [];
    let bestDistance = Infinity;

    for (let iter = 0; iter < this.iterations; iter++) {
      const antRoutes: number[][] = [];

      for (let ant = 0; ant < this.numAnts; ant++) {
        const route = this.constructRoute();
        const distance = this.calculateDistance(route);
        antRoutes.push(route);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestRoute = route;
        }
      }

      this.updatePheromone(antRoutes);
    }

    return bestRoute;
  }

  private constructRoute(): number[] {
    const n = this.distanceMatrix.length;
    const route: number[] = [];
    const visited = new Set<number>();

    let current = Math.floor(Math.random() * n);
    route.push(current);
    visited.add(current);

    while (visited.size < n) {
      let next = -1;
      const probabilities: number[] = [];
      let totalProb = 0;

      for (let i = 0; i < n; i++) {
        if (!visited.has(i)) {
          const pheromone = Math.pow(this.pheromone[current][i], this.alpha);
          const distance = Math.pow(1 / (this.distanceMatrix[current][i] + 0.001), this.beta);
          const prob = pheromone * distance;
          probabilities.push(prob);
          totalProb += prob;
        } else {
          probabilities.push(0);
        }
      }

      const rand = Math.random() * totalProb;
      let sum = 0;
      for (let i = 0; i < probabilities.length; i++) {
        sum += probabilities[i];
        if (sum >= rand && !visited.has(i)) {
          next = i;
          break;
        }
      }

      if (next === -1) {
        for (let i = 0; i < n; i++) {
          if (!visited.has(i)) {
            next = i;
            break;
          }
        }
      }

      route.push(next);
      visited.add(next);
      current = next;
    }

    return route;
  }

  private calculateDistance(route: number[]): number {
    let distance = 0;
    for (let i = 0; i < route.length; i++) {
      distance += this.distanceMatrix[route[i]][route[(i + 1) % route.length]];
    }
    return distance;
  }

  private updatePheromone(routes: number[][]) {
    // Evaporate
    for (let i = 0; i < this.pheromone.length; i++) {
      for (let j = 0; j < this.pheromone[i].length; j++) {
        this.pheromone[i][j] *= 1 - this.evaporationRate;
      }
    }

    // Deposit
    for (const route of routes) {
      const distance = this.calculateDistance(route);
      const contribution = 1 / distance;

      for (let i = 0; i < route.length; i++) {
        const from = route[i];
        const to = route[(i + 1) % route.length];
        this.pheromone[from][to] += contribution;
        this.pheromone[to][from] += contribution;
      }
    }
  }
}

// ========== CONVEX HULL (Graham Scan) ==========
export function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  return lower.concat(upper.slice(1, upper.length - 1));
}

// ========== LINE OF SIGHT CHECK ==========
export function hasLineOfSight(from: Point, to: Point, obstacles: Obstacle[]): boolean {
  for (const obs of obstacles) {
    if (pointToLineDistance(obs, from, to) < obs.radius) {
      return false;
    }
  }
  return true;
}

function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}
