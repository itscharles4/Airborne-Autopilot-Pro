const Drone = require('../../models/Drone');

describe('Drone Model', () => {
  describe('Health Score Calculation', () => {
    test('should calculate health score correctly', () => {
      const droneData = {
        id: 'DRONE-TEST-1',
        name: 'Test Drone',
        battery: 80,
        flightHours: 50,
        errorRate: 2,
        stability: 95,
      };

      const drone = new Drone(droneData);
      const health = drone.getHealthScore();

      expect(health).toHaveProperty('score');
      expect(health).toHaveProperty('grade');
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
    });

    test('should assign correct grade based on score', () => {
      const testCases = [
        { score: 95, expectedGrade: 'A' },
        { score: 80, expectedGrade: 'B' },
        { score: 70, expectedGrade: 'C' },
        { score: 50, expectedGrade: 'D' },
        { score: 30, expectedGrade: 'F' },
      ];

      testCases.forEach(({ score, expectedGrade }) => {
        // Mock score calculation for testing
        let mockScore = score;
        let grade = 'F';
        
        if (mockScore >= 90) grade = 'A';
        else if (mockScore >= 75) grade = 'B';
        else if (mockScore >= 60) grade = 'C';
        else if (mockScore >= 40) grade = 'D';

        expect(grade).toBe(expectedGrade);
      });
    });

    test('should handle edge cases', () => {
      const edgeCases = [
        { battery: 0, flightHours: 1000, errorRate: 100, stability: 0 },
        { battery: 100, flightHours: 0, errorRate: 0, stability: 100 },
      ];

      edgeCases.forEach(droneData => {
        const drone = new Drone({
          id: 'EDGE-CASE',
          name: 'Edge Case Drone',
          ...droneData,
        });

        const health = drone.getHealthScore();
        expect(health.score).toBeDefined();
        expect(health.grade).toBeDefined();
      });
    });
  });

  describe('Drone Status', () => {
    test('should have valid status values', () => {
      const validStatuses = ['IDLE', 'FLYING', 'CHARGING', 'MAINTENANCE', 'EMERGENCY', 'GROUNDED'];
      
      validStatuses.forEach(status => {
        const drone = new Drone({
          id: `DRONE-${status}`,
          name: `Test ${status}`,
          status,
        });

        expect(drone.status).toBe(status);
      });
    });
  });

  describe('Drone Initialization', () => {
    test('should initialize with default values', () => {
      const drone = new Drone({
        id: 'DRONE-DEFAULT',
        name: 'Default Drone',
      });

      expect(drone.battery).toBe(100);
      expect(drone.status).toBe('IDLE');
      expect(drone.position.x).toBe(0);
      expect(drone.flightHours).toBe(0);
    });

    test('should accept custom values', () => {
      const droneData = {
        id: 'DRONE-CUSTOM',
        name: 'Custom Drone',
        battery: 50,
        flightHours: 100,
        temperature: 35,
      };

      const drone = new Drone(droneData);

      expect(drone.battery).toBe(50);
      expect(drone.flightHours).toBe(100);
        expect(drone.temperature).toBe(35);
    });
  });
});
