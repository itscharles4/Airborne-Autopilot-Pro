/**
 * Fleet Optimization Engine
 * Multi-drone mission planning, resource allocation, load balancing
 */

export interface FleetDrone {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  battery: number;
  speed: number;
  position: { x: number; y: number };
  status: "IDLE" | "FLYING" | "CHARGING" | "MAINTENANCE";
}

export interface Delivery {
  id: string;
  x: number;
  y: number;
  weight: number;
  priority: number; // 1-10
  timeWindow?: { start: number; end: number };
  droneId?: string;
}

export interface FleetOptimizationResult {
  assignments: Map<string, Delivery[]>;
  totalDistance: number;
  estimatedTime: number;
  loadBalance: number;
  efficiency: number;
}

// ========== FLEET ALLOCATION ENGINE ==========
export class FleetOptimizationEngine {
  
  /**
   * Assign deliveries to drones using bin packing + distance optimization
   */
  assignDeliveries(
    drones: FleetDrone[],
    deliveries: Delivery[]
  ): FleetOptimizationResult {
    const assignments = new Map<string, Delivery[]>();
    const availableDrones = drones.filter(d => d.status === "IDLE" && d.battery > 20);

    if (availableDrones.length === 0) {
      return {
        assignments: new Map(),
        totalDistance: 0,
        estimatedTime: 0,
        loadBalance: 0,
        efficiency: 0
      };
    }

    // Sort deliveries by priority (descending)
    const sortedDeliveries = [...deliveries].sort((a, b) => b.priority - a.priority);

    // Initialize assignment map
    for (const drone of availableDrones) {
      assignments.set(drone.id, []);
    }

    // Greedy assignment with capacity constraints
    for (const delivery of sortedDeliveries) {
      let bestDrone: FleetDrone | null = null;
      let minCost = Infinity;

      for (const drone of availableDrones) {
        const currentLoad = (assignments.get(drone.id) || []).reduce((sum, d) => sum + d.weight, 0);
        
        // Check capacity
        if (currentLoad + delivery.weight > drone.capacity) continue;

        // Calculate assignment cost (distance + priority)
        const distance = Math.hypot(
          delivery.x - drone.position.x,
          delivery.y - drone.position.y
        );
        const cost = distance / drone.speed + (delivery.priority * 10);

        if (cost < minCost) {
          minCost = cost;
          bestDrone = drone;
        }
      }

      if (bestDrone) {
        const droneDeliveries = assignments.get(bestDrone.id) || [];
        droneDeliveries.push(delivery);
        assignments.set(bestDrone.id, droneDeliveries);
      }
    }

    // Calculate metrics
    const totalDistance = this.calculateTotalDistance(drones, assignments);
    const estimatedTime = this.calculateEstimatedTime(drones, assignments);
    const loadBalance = this.calculateLoadBalance(drones, assignments);
    const efficiency = this.calculateEfficiency(drones, assignments);

    return {
      assignments,
      totalDistance,
      estimatedTime,
      loadBalance,
      efficiency
    };
  }

  /**
   * Optimize for minimum battery consumption
   */
  optimizeForBattery(
    drones: FleetDrone[],
    deliveries: Delivery[]
  ): FleetOptimizationResult {
    const assignments = new Map<string, Delivery[]>();

    // Sort drones by battery (descending)
    const sortedDrones = [...drones]
      .filter(d => d.status === "IDLE")
      .sort((a, b) => b.battery - a.battery);

    for (const drone of sortedDrones) {
      assignments.set(drone.id, []);
    }

    // Assign deliveries to high-battery drones first
    for (const delivery of deliveries) {
      for (const drone of sortedDrones) {
        const currentLoad = (assignments.get(drone.id) || []).reduce((sum, d) => sum + d.weight, 0);
        if (currentLoad + delivery.weight <= drone.capacity) {
          const droneDeliveries = assignments.get(drone.id) || [];
          droneDeliveries.push(delivery);
          assignments.set(drone.id, droneDeliveries);
          break;
        }
      }
    }

    return {
      assignments,
      totalDistance: this.calculateTotalDistance(sortedDrones, assignments),
      estimatedTime: this.calculateEstimatedTime(sortedDrones, assignments),
      loadBalance: this.calculateLoadBalance(sortedDrones, assignments),
      efficiency: this.calculateEfficiency(sortedDrones, assignments)
    };
  }

  /**
   * Optimize for minimum time (parallel execution)
   */
  optimizeForTime(
    drones: FleetDrone[],
    deliveries: Delivery[]
  ): FleetOptimizationResult {
    const assignments = new Map<string, Delivery[]>();
    const availableDrones = drones.filter(d => d.status === "IDLE" && d.battery > 20);

    for (const drone of availableDrones) {
      assignments.set(drone.id, []);
    }

    // Greedy: assign each delivery to drone with least current cost
    for (const delivery of deliveries) {
      let bestDrone: FleetDrone | null = null;
      let minTime = Infinity;

      for (const drone of availableDrones) {
        const droneDeliveries = assignments.get(drone.id) || [];
        const distance = Math.hypot(
          delivery.x - drone.position.x,
          delivery.y - drone.position.y
        );
        const time = distance / drone.speed;

        if (time < minTime) {
          minTime = time;
          bestDrone = drone;
        }
      }

      if (bestDrone) {
        const droneDeliveries = assignments.get(bestDrone.id) || [];
        droneDeliveries.push(delivery);
        assignments.set(bestDrone.id, droneDeliveries);
      }
    }

    return {
      assignments,
      totalDistance: this.calculateTotalDistance(availableDrones, assignments),
      estimatedTime: this.calculateEstimatedTime(availableDrones, assignments),
      loadBalance: this.calculateLoadBalance(availableDrones, assignments),
      efficiency: this.calculateEfficiency(availableDrones, assignments)
    };
  }

  /**
   * Load balancing: distribute deliveries evenly
   */
  optimizeLoadBalance(
    drones: FleetDrone[],
    deliveries: Delivery[]
  ): FleetOptimizationResult {
    const assignments = new Map<string, Delivery[]>();
    const availableDrones = drones.filter(d => d.status === "IDLE" && d.battery > 20);

    for (const drone of availableDrones) {
      assignments.set(drone.id, []);
    }

    // Sort by current load (ascending) - assign to least loaded
    for (const delivery of deliveries) {
      let leastLoadedDrone: FleetDrone | null = null;
      let minLoad = Infinity;

      for (const drone of availableDrones) {
        const currentLoad = (assignments.get(drone.id) || []).reduce((sum, d) => sum + d.weight, 0);
        if (currentLoad + delivery.weight <= drone.capacity && currentLoad < minLoad) {
          minLoad = currentLoad;
          leastLoadedDrone = drone;
        }
      }

      if (leastLoadedDrone) {
        const droneDeliveries = assignments.get(leastLoadedDrone.id) || [];
        droneDeliveries.push(delivery);
        assignments.set(leastLoadedDrone.id, droneDeliveries);
      }
    }

    return {
      assignments,
      totalDistance: this.calculateTotalDistance(availableDrones, assignments),
      estimatedTime: this.calculateEstimatedTime(availableDrones, assignments),
      loadBalance: this.calculateLoadBalance(availableDrones, assignments),
      efficiency: this.calculateEfficiency(availableDrones, assignments)
    };
  }

  // ========== PRIVATE HELPERS ==========

  private calculateTotalDistance(
    drones: FleetDrone[],
    assignments: Map<string, Delivery[]>
  ): number {
    let total = 0;
    for (const drone of drones) {
      const deliveries = assignments.get(drone.id) || [];
      let currentX = drone.position.x;
      let currentY = drone.position.y;

      for (const delivery of deliveries) {
        total += Math.hypot(delivery.x - currentX, delivery.y - currentY);
        currentX = delivery.x;
        currentY = delivery.y;
      }
    }
    return total;
  }

  private calculateEstimatedTime(
    drones: FleetDrone[],
    assignments: Map<string, Delivery[]>
  ): number {
    let maxTime = 0;
    for (const drone of drones) {
      const deliveries = assignments.get(drone.id) || [];
      let time = 0;
      let currentX = drone.position.x;
      let currentY = drone.position.y;

      for (const delivery of deliveries) {
        const distance = Math.hypot(delivery.x - currentX, delivery.y - currentY);
        time += distance / drone.speed;
        currentX = delivery.x;
        currentY = delivery.y;
      }

      maxTime = Math.max(maxTime, time);
    }
    return maxTime;
  }

  private calculateLoadBalance(
    drones: FleetDrone[],
    assignments: Map<string, Delivery[]>
  ): number {
    const loads = drones.map(d => {
      const deliveries = assignments.get(d.id) || [];
      return deliveries.reduce((sum, del) => sum + del.weight, 0);
    });

    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / loads.length;
    const stdDev = Math.sqrt(variance);

    // Return 0-100 score (higher = more balanced)
    return Math.max(0, 100 - stdDev * 5);
  }

  private calculateEfficiency(
    drones: FleetDrone[],
    assignments: Map<string, Delivery[]>
  ): number {
    let totalDeliveries = 0;
    let totalCapacity = 0;

    for (const drone of drones) {
      const deliveries = assignments.get(drone.id) || [];
      const load = deliveries.reduce((sum, d) => sum + d.weight, 0);
      totalDeliveries += load;
      totalCapacity += drone.capacity;
    }

    return totalCapacity > 0 ? (totalDeliveries / totalCapacity) * 100 : 0;
  }
}

// ========== MULTI-DEPOT SUPPORT ==========
export interface Depot {
  id: string;
  x: number;
  y: number;
  name: string;
  capacity: number;
}

export class MultiDepotOptimizer {
  private depots: Depot[];
  private engine: FleetOptimizationEngine;

  constructor(depots: Depot[]) {
    this.depots = depots;
    this.engine = new FleetOptimizationEngine();
  }

  /**
   * Assign deliveries to depots first, then to drones
   */
  optimizeMultiDepot(
    drones: FleetDrone[],
    deliveries: Delivery[]
  ): Map<string, FleetOptimizationResult> {
    const results = new Map<string, FleetOptimizationResult>();

    // Group deliveries by nearest depot
    const depotDeliveries = new Map<string, Delivery[]>();
    for (const depot of this.depots) {
      depotDeliveries.set(depot.id, []);
    }

    for (const delivery of deliveries) {
      let nearestDepot = this.depots[0];
      let minDistance = Infinity;

      for (const depot of this.depots) {
        const dist = Math.hypot(delivery.x - depot.x, delivery.y - depot.y);
        if (dist < minDistance) {
          minDistance = dist;
          nearestDepot = depot;
        }
      }

      const list = depotDeliveries.get(nearestDepot.id) || [];
      list.push(delivery);
      depotDeliveries.set(nearestDepot.id, list);
    }

    // Optimize per depot
    for (const depot of this.depots) {
      const depotDels = depotDeliveries.get(depot.id) || [];
      const dronesForDepot = drones.filter(d => 
        Math.hypot(d.position.x - depot.x, d.position.y - depot.y) < 500 // within service range
      );

      if (dronesForDepot.length > 0 && depotDels.length > 0) {
        const result = this.engine.optimizeLoadBalance(dronesForDepot, depotDels);
        results.set(depot.id, result);
      }
    }

    return results;
  }
}
