const axios = require('axios');
const logger = require('../utils/logger');

class WeatherService {
  constructor() {
    this.API_KEY = process.env.OPENWEATHER_API_KEY || 'demo'; // Use OpenWeather API
    this.cacheData = new Map();
    this.CACHE_DURATION = 600000; // 10 minutes
  }

  /**
   * Get current weather for location
   */
  async getCurrentWeather(lat, lng) {
    try {
      const cacheKey = `${lat},${lng}`;
      
      // Check cache
      if (this.cacheData.has(cacheKey)) {
        const cached = this.cacheData.get(cacheKey);
        if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
          return cached.data;
        }
      }

      // Mock weather data (in production, use real API)
      const weatherData = this.generateMockWeather(lat, lng);

      // Cache the data
      this.cacheData.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now(),
      });

      return weatherData;
    } catch (error) {
      logger.error('Error fetching weather:', error.message);
      return this.getDefaultWeather();
    }
  }

  /**
   * Generate mock weather data for demo
   */
  generateMockWeather(lat, lng) {
    return {
      location: { lat, lng },
      temperature: 20 + Math.random() * 15,
      humidity: 40 + Math.random() * 50,
      windSpeed: Math.random() * 30,
      windDirection: Math.floor(Math.random() * 360),
      rainIntensity: Math.random() * 100,
      visibility: 8000 + Math.random() * 2000,
      cloudCoverage: Math.floor(Math.random() * 100),
      condition: this.getWeatherCondition(Math.random()),
      uv: Math.floor(Math.random() * 11),
      seaLevel: 1013 + Math.random() * 20,
      timestamp: new Date(),
    };
  }

  /**
   * Get weather condition string
   */
  getWeatherCondition(random) {
    if (random < 0.7) return 'CLEAR';
    if (random < 0.85) return 'CLOUDY';
    if (random < 0.95) return 'RAINY';
    return 'THUNDERSTORM';
  }

  /**
   * Get default weather (fallback)
   */
  getDefaultWeather() {
    return {
      temperature: 20,
      humidity: 50,
      windSpeed: 10,
      rainIntensity: 0,
      visibility: 10000,
      condition: 'CLEAR',
      timestamp: new Date(),
    };
  }

  /**
   * Check if weather is suitable for drone flight
   */
  isSuitableForFlight(weather) {
    // Wind speed > 25 km/h is dangerous
    if (weather.windSpeed > 25) return false;

    // Heavy rain (>50) is dangerous
    if (weather.rainIntensity > 50) return false;

    // Very low visibility
    if (weather.visibility < 1000) return false;

    // Thunderstorm is definitely not suitable
    if (weather.condition === 'THUNDERSTORM') return false;

    return true;
  }

  /**
   * Get weather impact on drone performance
   */
  getWeatherImpact(weather) {
    let impact = {
      speedReduction: 0,
      batteryConsumptionIncrease: 0,
      reliabilityScore: 100,
      recommendation: 'PROCEED',
    };

    // Wind impact
    if (weather.windSpeed > 10) {
      impact.speedReduction = (weather.windSpeed / 30) * 20; // Reduce speed
      impact.batteryConsumptionIncrease += weather.windSpeed * 0.5;
      impact.reliabilityScore -= weather.windSpeed * 2;
    }

    // Rain impact
    if (weather.rainIntensity > 20) {
      impact.batteryConsumptionIncrease += weather.rainIntensity * 1;
      impact.reliabilityScore -= weather.rainIntensity * 1.5;
      impact.recommendation = 'PROCEED_WITH_CAUTION';
    }

    // Heavy rain
    if (weather.rainIntensity > 50) {
      impact.recommendation = 'ABORT_FLIGHT';
      impact.reliabilityScore = 0;
    }

    // Cold impact (affects battery)
    if (weather.temperature < 0) {
      impact.batteryConsumptionIncrease += 20;
      impact.reliabilityScore -= 10;
    }

    return impact;
  }

  /**
   * Predict weather for next N hours
   */
  async predictWeather(lat, lng, hours = 4) {
    try {
      const predictions = [];

      for (let i = 1; i <= hours; i++) {
        const prediction = {
          hour: i,
          timestamp: new Date(Date.now() + i * 3600000),
          temperature: 20 + Math.random() * 15,
          humidity: 40 + Math.random() * 50,
          windSpeed: Math.random() * (25 + i), // Wind increases
          rainIntensity: Math.random() * (100 - i * 10),
          visibility: 8000 + Math.random() * 2000,
          condition: this.getWeatherCondition(Math.random()),
        };
        predictions.push(prediction);
      }

      return predictions;
    } catch (error) {
      logger.error('Error predicting weather:', error.message);
      return [];
    }
  }

  /**
   * Get weather alerts
   */
  async getWeatherAlerts(lat, lng) {
    try {
      const weather = await this.getCurrentWeather(lat, lng);
      const alerts = [];

      if (weather.windSpeed > 25) {
        alerts.push({
          type: 'HIGH_WIND',
          severity: 'WARNING',
          message: `High wind speed: ${weather.windSpeed.toFixed(1)} km/h`,
        });
      }

      if (weather.rainIntensity > 50) {
        alerts.push({
          type: 'HEAVY_RAIN',
          severity: 'CRITICAL',
          message: `Heavy rain detected`,
        });
      }

      if (weather.condition === 'THUNDERSTORM') {
        alerts.push({
          type: 'THUNDERSTORM',
          severity: 'CRITICAL',
          message: 'Thunderstorm in area',
        });
      }

      if (weather.visibility < 1000) {
        alerts.push({
          type: 'LOW_VISIBILITY',
          severity: 'WARNING',
          message: `Low visibility: ${weather.visibility}m`,
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Error getting weather alerts:', error.message);
      return [];
    }
  }
}

module.exports = WeatherService;
