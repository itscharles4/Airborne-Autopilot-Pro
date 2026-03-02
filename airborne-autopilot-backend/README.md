# Airborne Autopilot Pro — Backend

Complete backend for the Airborne Autopilot Pro drone fleet management system.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7+
- Redis 7+

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing key
- `GEMINI_API_KEY`: Google Gemini API key

### Development

```bash
npm run dev
```

Starts the server with hot reload on port 5000.

### Seed Database

```bash
npm run seed
```

Creates 4 sample drones and 4 test users.

### Production

```bash
npm start
```

### Docker

```bash
docker-compose up -d
```

This starts API, MongoDB, and Redis containers.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Drones
- `GET /api/v1/drones` - List all drones
- `GET /api/v1/drones/:id` - Get drone by ID
- `POST /api/v1/drones` - Create drone
- `PUT /api/v1/drones/:id` - Update drone
- `DELETE /api/v1/drones/:id` - Delete drone
- `GET /api/v1/drones/:id/health` - Get drone health score
- `GET /api/v1/drones/available` - List available drones
- `POST /api/v1/drones/:id/command` - Send drone command

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/:id` - Get order by ID
- `GET /api/v1/orders/:id/track` - Track order
- `PUT /api/v1/orders/:id/cancel` - Cancel order
- `PUT /api/v1/orders/:id/complete` - Complete order

### Pathfinding
- `POST /api/v1/pathfinder/dijkstra` - Compute shortest path
- `POST /api/v1/pathfinder/tsp` - Solve traveling salesman
- `GET /api/v1/pathfinder/graph` - Get delivery network graph

### Flights
- `GET /api/v1/flights` - List flights
- `GET /api/v1/flights/:id` - Get flight by ID
- `GET /api/v1/flights/:id/replay` - Get flight replay data
- `GET /api/v1/flights/active` - Get active flights

### Revenue
- `GET /api/v1/revenue/summary` - Revenue summary
- `GET /api/v1/revenue/drones` - Revenue by drone
- `GET /api/v1/revenue/costs` - Cost breakdown
- `GET /api/v1/revenue/daily` - Daily revenue data
- `GET /api/v1/revenue/export` - Export as CSV

### Missions
- `POST /api/v1/missions/plan` - Plan AI mission
- `POST /api/v1/missions/analyze-airspace` - Analyze airspace
- `GET /api/v1/missions/templates` - Get mission templates
- `POST /api/v1/missions/deploy` - Deploy mission

### Alerts
- `GET /api/v1/alerts` - Get alerts
- `POST /api/v1/alerts` - Create alert
- `PUT /api/v1/alerts/:id/resolve` - Resolve alert
- `DELETE /api/v1/alerts/:id` - Delete alert

## Architecture

### Layers
- **Routes**: Express route handlers
- **Controllers**: Business logic
- **Models**: MongoDB schemas
- **Middleware**: Auth, RBAC, error handling
- **Algorithms**: Dijkstra, TSP solver
- **Sockets**: Real-time updates
- **Config**: Database & caching

### Real-Time Features
- Live drone telemetry via Socket.IO
- Collision detection
- Battery alerts
- Fleet updates
- Health score monitoring

## Database

MongoDB collections:
- `drones` - Fleet inventory
- `orders` - Delivery orders
- `flights` - Flight records
- `users` - System users
- `alerts` - System alerts
- `revenues` - Revenue tracking

## Roles & Permissions

- **ADMIN**: Full access (`*`)
- **OPERATOR**: Manage drones & orders
- **ANALYST**: View data & reports
- **VIEWER**: Read-only drone/flight info

## Testing

```bash
npm test
```

## License

MIT
