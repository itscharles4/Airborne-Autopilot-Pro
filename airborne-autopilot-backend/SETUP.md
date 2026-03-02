# Airborne Autopilot Pro — Backend Setup & Deployment Guide

## Project Structure

```
airborne-autopilot-backend/
├── src/
│   ├── config/               # Database & Redis config
│   │   ├── db.js
│   │   └── redis.js
│   ├── models/               # Mongoose schemas
│   │   ├── Drone.js
│   │   ├── Order.js
│   │   ├── Flight.js
│   │   ├── User.js
│   │   ├── Alert.js
│   │   └── Revenue.js
│   ├── controllers/          # Business logic
│   │   ├── authController.js
│   │   ├── droneController.js
│   │   ├── orderController.js
│   │   ├── pathfinderController.js
│   │   ├── flightController.js
│   │   ├── revenueController.js
│   │   ├── missionController.js
│   │   └── alertController.js
│   ├── routes/               # Express routes
│   │   ├── auth.js
│   │   ├── drones.js
│   │   ├── orders.js
│   │   ├── pathfinder.js
│   │   ├── flights.js
│   │   ├── revenue.js
│   │   ├── missions.js
│   │   └── alerts.js
│   ├── middleware/           # Auth, RBAC, error handling
│   │   ├── auth.js
│   │   ├── rbac.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── algorithms/           # Pathfinding algorithms
│   │   ├── graph.js
│   │   ├── dijkstra.js
│   │   └── tsp.js
│   ├── sockets/              # Real-time updates
│   │   ├── socketHandler.js
│   │   └── telemetrySimulator.js
│   ├── utils/                # Helper functions
│   │   ├── logger.js
│   │   └── seed.js
│   ├── app.js                # Express app
│   └── server.js             # Entry point
├── tests/                    # Test files
├── logs/                     # Application logs
├── docker-compose.yml        # Docker orchestration
├── Dockerfile                # Container image
├── package.json              # Dependencies
├── .env                      # Environment variables
├── README.md                 # General documentation
├── API_REFERENCE.md          # Complete API docs
├── FRONTEND_INTEGRATION.md   # Frontend integration guide
└── SETUP.md                  # This file
```

---

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **MongoDB**: v7 (local or Atlas)
- **Redis**: v7 (local or cloud)

---

## Installation

### 1. Clone/Create Project

```bash
cd "c:\Users\CHARLESJK\OneDrive\Documents\SOFT_eng_dsa project"
cd airborne-autopilot-backend
```

### 2. Install Dependencies

```bash
npm install
```

This installs all production and development dependencies including:
- Express.js
- Mongoose
- Socket.IO
- JWT authentication
- Rate limiting
- Logging

---

## Configuration

### 1. Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/airborne_autopilot

# Cache
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=airborne_super_secret_jwt_key_2025
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=airborne_refresh_secret_key_2025
JWT_REFRESH_EXPIRES_IN=7d

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# CORS
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click "Get API key"
3. Create a new key
4. Paste it in `.env` as `GEMINI_API_KEY`

---

## Local Development

### Start MongoDB

#### Option 1: Local Installation
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Option 2: Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### Start Redis

#### Option 1: Local Installation
```bash
# Windows (if installed via WSL or Chocolatey)
redis-server

# macOS
brew services start redis

# Linux
sudo systemctl start redis-server
```

#### Option 2: Docker
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Seed Database

Populate with sample data:

```bash
npm run seed
```

This creates:
- **4 Drones**: Alpha-1, Beta-2, Gamma-3, Delta-4
- **4 Users**: 
  - admin@charronix.com (Admin)
  - operator@charronix.com (Operator)
  - analyst@charronix.com (Analyst)
  - charles@charronix.com (Admin)

All passwords are `<Role>@123` (e.g., `Admin@123`)

### Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

## Docker Compose (Recommended)

Start all services with Docker:

```bash
docker-compose up -d
```

This starts:
- API on port 5000
- MongoDB on port 27017
- Redis on port 6379

View logs:
```bash
docker-compose logs -f api
```

Stop all services:
```bash
docker-compose down
```

---

## Testing

### Run Test Suite

```bash
npm test
```

This runs Jest with coverage reporting.

### Manual API Testing

#### Using curl

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@charronix.com","password":"Admin@123"}'

# Get Drones (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/v1/drones \
  -H "Authorization: Bearer TOKEN"
```

#### Using Postman

1. Import the collection from endpoint docs
2. Set `{{base_url}}` to `http://localhost:5000/api/v1`
3. Set `{{token}}` after login

---

## Production Deployment

### 1. Set Production Environment

```bash
NODE_ENV=production
```

### 2. Use Production Secrets

Update `.env` with:
- Strong `JWT_SECRET`
- Real MongoDB URI (MongoDB Atlas)
- Real Redis instance
- Valid `GEMINI_API_KEY`

### 3. Build Docker Image

```bash
docker build -t airborne-autopilot-backend:1.0 .
```

### 4. Run Container

```bash
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  --name airborne-api \
  airborne-autopilot-backend:1.0
```

### 5. Deploy to Cloud

#### Heroku

```bash
heroku login
heroku create airborne-autopilot-api
git push heroku main
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<your-secret>
# Set other env vars...
```

#### AWS ECS

```bash
aws ecr create-repository --repository-name airborne-api
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag airborne-autopilot-backend:1.0 <account>.dkr.ecr.us-east-1.amazonaws.com/airborne-api:1.0
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/airborne-api:1.0
# Configure ECS task and service...
```

#### DigitalOcean App Platform

1. Push code to GitHub
2. Connect GitHub repo in DO
3. Set environment variables
4. Deploy automatically

---

## Health Checks

Monitor the API:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{ "status": "OK", "timestamp": "2025-03-01T10:30:00Z" }
```

---

## Logging

Check logs:

```bash
# View all logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log
```

Environment-based logging:
- **Development**: Console + file (info level)
- **Production**: File only (warn level)

---

## Database Backup

### MongoDB

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/airborne_autopilot" --out=./backups

# Restore
mongorestore --uri="mongodb://localhost:27017/airborne_autopilot" ./backups/airborne_autopilot
```

### Redis

```bash
# Backup
redis-cli --rdb /path/to/backup.rdb

# Monitor
redis-cli MONITOR
```

---

## Performance Optimization

### 1. Enable Caching

Results are cached in Redis:
- Pathfinding results: 5 minutes
- Graph data: On demand

### 2. Database Indexing

Indexes are created automatically:
- `Drone.id` (unique)
- `User.email` (unique)
- `Alert.resolved + createdAt`
- `Flight.droneId + status`

### 3. Rate Limiting

- API: 100 requests per 15 minutes
- Auth: 10 attempts per 15 minutes

### 4. Compression

All responses are gzip compressed.

---

## Troubleshooting

### MongoDB Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

Solution:
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### Redis Connection Error

```
Error: ECONNREFUSED 127.0.0.1:6379
```

Solution:
- Ensure Redis is running
- Check `REDIS_URL` in `.env`
- Non-critical: API works without Redis

### JWT Token Errors

```
Invalid token
```

Solution:
- Ensure `JWT_SECRET` matches between login and requests
- Check token in Authorization header format: `Bearer <token>`
- Refresh token if expired

### Gemini API Errors

```
Gemini API error: 401
```

Solution:
- Verify `GEMINI_API_KEY` is valid
- Check API quota in Google AI Studio
- Ensure internet connectivity

---

## Next Steps

1. **Frontend Integration**: See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
2. **API Documentation**: See [API_REFERENCE.md](API_REFERENCE.md)
3. **Advanced Features**:
   - Implement WebSocket subscription patterns
   - Add database transactions
   - Set up automated backups
   - Configure CDN for static files

---

## Support

For issues or questions:
- Check logs: `logs/combined.log`
- Review API docs: `API_REFERENCE.md`
- Test endpoints: Use curl or Postman
- Verify environment: Check `.env` file
