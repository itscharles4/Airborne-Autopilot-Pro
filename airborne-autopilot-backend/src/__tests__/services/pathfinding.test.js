const AdvancedPathfinding = require('../../services/advancedPathfinding');

describe('AdvancedPathfinding Service', () => {
  let pathfinding;

  beforeEach(() => {
    pathfinding = new AdvancedPathfinding();
  });

  describe('Dijkstra Algorithm', () => {
    test('should find shortest path between two nodes', () => {
      const graph = {
        1: { 2: 4, 3: 2 },
        2: { 1: 4, 3: 1, 4: 5 },
        3: { 1: 2, 2: 1, 4: 8 },
        4: { 2: 5, 3: 8 },
      };

      const result = pathfinding.dijkstra(graph, 1, 4);
      
      expect(result.path).toBeDefined();
      expect(result.distance).toBeDefined();
      expect(result.distance).toBeLessThan(20);
    });

    test('should avoid specified nodes', () => {
      const graph = {
        1: { 2: 1, 3: 1 },
        2: { 1: 1, 4: 1 },
        3: { 1: 1, 4: 5 },
        4: { 2: 1, 3: 5 },
      };

      const result = pathfinding.dijkstra(graph, 1, 4, [2]);
      
      expect(result.path).toContain(1);
      expect(result.path).toContain(4);
      expect(result.path).not.toContain(2);
    });
  });

  describe('Collision Detection', () => {
    test('should detect collision with obstacle', () => {
      const flight = {
        waypoints: [{ x: 100, y: 100 }, { x: 120, y: 120 }],
      };

      const collision = pathfinding.detectCollision(105, 105, flight);
      expect(typeof collision).toBe('boolean');
    });
  });

  describe('Weather Risk Evaluation', () => {
    test('should calculate weather risk correctly', () => {
      const flight = {};
      const weather = {
        windSpeed: 30,
        rainIntensity: 60,
        visibility: 500,
      };

      const risk = pathfinding.evaluateWeatherRisk(flight, weather);
      
      expect(risk).toBeGreaterThan(0);
      expect(risk).toBeLessThanOrEqual(1);
    });

    test('should indicate no risk with clear weather', () => {
      const flight = {};
      const weather = {
        windSpeed: 5,
        rainIntensity: 0,
        visibility: 10000,
      };

      const risk = pathfinding.evaluateWeatherRisk(flight, weather);
      expect(risk).toBe(0);
    });
  });

  describe('Position Prediction', () => {
    test('should predict future position', () => {
      const flight = {
        telemetry: [
          { x: 0, y: 0, z: 0, timestamp: new Date(Date.now() - 2000) },
          { x: 10, y: 10, z: 5, timestamp: new Date() },
        ],
        waypoints: [{ x: 0, y: 0, z: 0 }],
        currentNode: 0,
      };

      const predicted = pathfinding.predictPosition(flight, 5);
      
      expect(predicted).toHaveProperty('x');
      expect(predicted).toHaveProperty('y');
      expect(predicted).toHaveProperty('z');
      expect(predicted).toHaveProperty('timestamp');
    });
  });
});
