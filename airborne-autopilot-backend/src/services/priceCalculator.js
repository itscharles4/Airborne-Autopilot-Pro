const { dijkstra } = require('../algorithms/dijkstra');
const logger = require('../utils/logger');

const BASE_RATE = 2.5;
const PRIORITY_MULTIPLIERS = {
  STANDARD: 1.0,
  EXPRESS: 1.25,
  URGENT: 1.5,
};

const CACHE_TTL = 300 * 1000; // 5 minutes
const distanceCache = new Map();

function _cacheKey(pickupNode, deliveryNode) {
  return `${pickupNode}:${deliveryNode}`;
}

class PriceCalculator {
  static calculate_distance(pickupNode, deliveryNode) {
    const key = _cacheKey(pickupNode, deliveryNode);
    const cached = distanceCache.get(key);

    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.distance;
    }

    const start = process.hrtime.bigint();
    const pathResult = dijkstra(pickupNode, deliveryNode);
    const end = process.hrtime.bigint();

    if (!pathResult) {
      throw new Error('No path found');
    }

    const elapsedMs = Number(end - start) / 1e6;
    if (elapsedMs > 100) {
      logger.warn(`Dijkstra exceeded 100ms: ${elapsedMs.toFixed(2)}ms`);
    }
    if (elapsedMs > 500) {
      throw new Error('Price calculation timeout');
    }

    const distance = pathResult.totalDistance;
    distanceCache.set(key, { distance, ts: Date.now() });
    return distance;
  }

  static calculate_price(pickupNode, deliveryNode, priority) {
    if (!PRIORITY_MULTIPLIERS[priority]) {
      throw new Error('Invalid priority');
    }

    const distance = PriceCalculator.calculate_distance(pickupNode, deliveryNode);
    const multiplier = PRIORITY_MULTIPLIERS[priority];
    const price = distance * BASE_RATE * multiplier;
    return Number(price.toFixed(2));
  }
}

module.exports = { PriceCalculator, PRIORITY_MULTIPLIERS };
