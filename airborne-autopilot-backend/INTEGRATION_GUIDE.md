# 🔧 Server Integration Guide

## Step-by-Step Integration Instructions

### 1. Update Server Configuration

Add the following to `src/server.js`:

```javascript
const TelemetryEngine = require('./services/telemetryEngine');
const AdvancedPathfinding = require('./services/advancedPathfinding');
const DigitalTwinSimulator = require('./services/digitalTwinSimulator');
const WeatherService = require('./services/weatherService');
const AIService = require('./services/aiService');
const GeminiService = require('./services/geminiService'); // Existing

// Initialize services
const telemetryEngine = new TelemetryEngine(io);
const pathfinding = new AdvancedPathfinding();
const simulator = new DigitalTwinSimulator();
const weatherService = new WeatherService();
const aiService = new AIService(geminiService); // Use existing Gemini

// Store services on app for access in controllers
app.set('telemetryEngine', telemetryEngine);
app.set('pathfinding', pathfinding);
app.set('simulator', simulator);
app.set('weatherService', weatherService);
app.set('aiService', aiService);

// Start telemetry engine
telemetryEngine.start();

// Register advanced routes
app.use('/api/v1', require('./routes/advanced'));
```

### 2. Update Socket.IO Handlers

Add telemetry event handlers in `src/sockets/socketHandler.js`:

```javascript
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Telemetry listeners
    socket.on('telemetry:subscribe', (data) => {
      socket.join(`drone:${data.droneId}`);
    });

    socket.on('flight:track', (data) => {
      socket.join(`flight:${data.flightId}`);
    });

    socket.on('simulation:watch', (data) => {
      socket.join(`simulation:${data.simulationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
```

### 3. Update Package.json

Ensure the following dependencies are installed:

```json
{
  "dependencies": {
    "mongoose": "^8.0.0",
    "express": "^4.18.2",
    "socket.io": "^4.5.0",
    "dotenv": "^16.0.0",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0",
    "redis": "^4.6.0",
    "ioredis": "^5.3.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "nodemon": "^3.0.0"
  },
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 4. Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=5001

# Database
MONGODB_URI=mongodb://localhost:27017/airborne_autopilot

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h

# Frontend
FRONTEND_URL=http://localhost:3001

# APIs
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_weather_api_key

# Features
TELEMETRY_ENABLED=true
AI_ENABLED=true
GEOFENCING_ENABLED=true
```

### 5. Update Controllers

Example: `src/controllers/flightController.js`

```javascript
const Flight = require('../models/Flight');
const Order = require('../models/Order');

module.exports = {
  // Start flight with AI planning
  async startFlight(req, res) {
    try {
      const { orderId } = req.body;
      
      const order = await Order.findById(orderId);
      const drones = await Drone.find({ status: 'IDLE' });
      const weather = await req.app.get('weatherService').getCurrentWeather(0, 0);

      // AI mission planning
      const missionPlan = await req.app.get('aiService').planMission(
        order,
        drones,
        weather
      );

      // Create flight
      const flight = await Flight.create({
        droneId: missionPlan.selectedDroneId,
        orderId,
        status: 'PRE_FLIGHT',
        path: missionPlan.path,
        startTime: new Date(),
      });

      res.json({ status: 'success', flight });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get flight with telemetry
  async getFlight(req, res) {
    try {
      const flight = await Flight.findById(req.params.id)
        .populate('orderId');

      res.json({ status: 'success', flight });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
```

### 6. Testing Services

Run tests:

```bash
# Install dependencies
npm install --save-dev jest supertest

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/services/pathfinding.test.js
```

### 7. Docker Deployment

Build and run with Docker:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### 8. Monitoring & Debugging

**Check services status:**
```bash
# Backend health
curl http://localhost:5001/health

# MongoDB connection
curl http://localhost:5001/api/v1/drones

# WebSocket connection
# Open browser console: 
# const socket = io('http://localhost:5001')
# socket.on('drone:telemetry', (data) => console.log(data))
```

**View logs:**
```bash
# Backend logs
docker logs airborne-backend

# MongoDB logs
docker logs airborne-mongo

# Redis logs
docker logs airborne-redis
```

### 9. Performance Optimization

**Indexing (MongoDB):**
```javascript
// Add to db.js
db.collection('drones').createIndex({ id: 1 });
db.collection('flights').createIndex({ droneId: 1, createdAt: -1 });
db.collection('orders').createIndex({ status: 1 });
```

**Caching (Redis):**
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache drone status
await client.setex(`drone:${droneId}`, 60, JSON.stringify(drone));

// Retrieve from cache
const cached = await client.get(`drone:${droneId}`);
```

### 10. Production Checklist

- [ ] All environment variables configured
- [ ] MongoDB replica set for production
- [ ] Redis instance running (not localhost)
- [ ] SSL certificates configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] API documentation complete
- [ ] Monitoring/alerting setup
- [ ] Backup strategy implemented
- [ ] Load testing passed

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB
mongod

# 3. Start Redis
redis-server

# 4. Create .env file
cp .env.example .env

# 5. Start backend
npm run dev

# 6. Start frontend (in another terminal)
cd ../airborne-autopilot-pro\ \(4\)
npm run dev

# 7. Open browser
# http://localhost:3001
```

---

## Troubleshooting

**WebSocket not connecting:**
- Check FRONTEND_URL in .env
- Verify socket.io is listening
- Check browser console for errors

**Telemetry not updating:**
- Ensure telemetryEngine.start() is called
- Check MongoDB connection
- Verify drones exist in database

**AI Service errors:**
- Validate Gemini API key
- Check API rate limits
- Verify prompt format

**Tests failing:**
- Run: `npm install --save-dev jest`
- Ensure MongoDB is running for integration tests
- Check NODE_ENV is 'test'

---

**Integration Guide Version**: 1.0.0
**Last Updated**: 2026-04-02
