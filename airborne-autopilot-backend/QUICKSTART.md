# Quick Start Cheat Sheet

## 🚀 Start Backend in 5 Minutes

### Prerequisites
- Node.js 18+, MongoDB 7+, Redis 7+

### Quick Setup
```bash
cd airborne-autopilot-backend
npm install
cp .env.example .env
npm run seed      # Load sample data
npm run dev       # Start on port 5000
```

---

## 📍 Key Directories

| Path | Purpose |
|------|---------|
| `src/models/` | MongoDB schemas |
| `src/controllers/` | Business logic |
| `src/routes/` | API endpoints |
| `src/algorithms/` | Dijkstra & TSP |
| `src/middleware/` | Auth, RBAC, errors |
| `src/sockets/` | Real-time updates |

---

## 🔑 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@charronix.com | Admin@123 | ADMIN |
| operator@charronix.com | Operator@123 | OPERATOR |
| analyst@charronix.com | Analyst@123 | ANALYST |
| charles@charronix.com | Charles@123 | ADMIN |

---

## 📡 Essential Endpoints

### Auth
```
POST   /auth/login           — Get token
GET    /auth/me              — Current user
```

### Drones
```
GET    /drones               — List all
GET    /drones/:id/health    — Health score
POST   /drones/:id/command   — Send command
```

### Orders
```
POST   /orders               — Create order
GET    /orders/:id/track     — Track order
PUT    /orders/:id/complete  — Complete order
```

### Pathfinding
```
POST   /pathfinder/dijkstra  — Shortest path
POST   /pathfinder/tsp       — Multi-stop route
GET    /pathfinder/graph     — Network graph
```

### Revenue
```
GET    /revenue/summary      — Revenue stats
GET    /revenue/drones       — By drone
GET    /revenue/export       — CSV export
```

---

## 🔐 Authentication

### Login Flow
```bash
# 1. Login to get token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@charronix.com","password":"Admin@123"}'

# 2. Use token in requests
curl -X GET http://localhost:5000/api/v1/drones \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### Token Refresh
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<REFRESH_TOKEN>"}'
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all
docker-compose down

# Rebuild image
docker-compose build --no-cache
```

---

## 🗄️ Database Management

```bash
# Seed sample data
npm run seed

# MongoDB shell
mongo airborne_autopilot

# Backup
mongodump --out ./backups
```

---

## 🧪 Common API Patterns

### Create Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John",
    "pickupNode": 0,
    "deliveryNode": 5,
    "packageWeight": 2.5,
    "priority": "EXPRESS"
  }'
```

### Get Drone Health
```bash
curl -X GET http://localhost:5000/api/v1/drones/Alpha-1/health \
  -H "Authorization: Bearer <TOKEN>"
```

### Compute Path
```bash
curl -X POST http://localhost:5000/api/v1/pathfinder/dijkstra \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"start": 0, "end": 5, "avoid": [3]}'
```

---

## 📊 Real-Time Updates (Socket.IO)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.emit('subscribe:fleet');
socket.on('fleet:update', (data) => console.log(data));
socket.on('drone:alert', (alert) => console.log(alert));
```

---

## 🛠️ Development Commands

```bash
npm run dev       # Start with hot reload
npm test          # Run tests
npm start         # Production start
npm run seed      # Seed database
```

---

## 📝 Environment Variables

Key variables in `.env`:
- `MONGODB_URI` — Database connection
- `REDIS_URL` — Cache connection  
- `JWT_SECRET` — Token signing key
- `GEMINI_API_KEY` — AI API key
- `PORT` — Server port
- `NODE_ENV` — development/production

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB won't connect | Ensure `mongod` is running, check `MONGODB_URI` |
| Redis timeout | Start Redis server or disable for dev |
| Token errors | Check JWT_SECRET matches, verify token format |
| CORS errors | Ensure FRONTEND_URL matches your frontend |
| Gemini API fails | Verify `GEMINI_API_KEY` is valid |

---

## 📚 Full Documentation

- **Setup Guide**: [SETUP.md](SETUP.md)
- **API Reference**: [API_REFERENCE.md](API_REFERENCE.md)
- **Frontend Integration**: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
- **README**: [README.md](README.md)

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| API | http://localhost:5000 |
| Health | http://localhost:5000/health |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6379 |

---

## 💾 Sample Data (Seeded Drones)

| ID | Name | Model | Status |
|----|------|-------|--------|
| Alpha-1 | Alpha-1 | DJI Mavic 3 | IDLE |
| Beta-2 | Beta-2 | DJI Phantom 4 | IDLE |
| Gamma-3 | Gamma-3 | Autel Evo II | CHARGING |
| Delta-4 | Delta-4 | Skydio 2+ | IDLE |

---

## 🎯 City Graph Nodes (20 locations)

0: Depot, 1: Hospital, 2: Mall, 3: Airport, 4: Port, 5: Downtown, 6: University, 7: Stadium, 8: Park, 9: Library, 10: Market, 11: Station, 12: Hotel, 13: School, 14: Factory, 15: Bank, 16: Clinic, 17: Warehouse, 18: Plaza, 19: Tower

---

## 🔐 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| ADMIN | Full access (`*`) |
| OPERATOR | Manage drones, orders, missions |
| ANALYST | View data, reports, health |
| VIEWER | Read-only: drones, flights |

---

Perfect! Your backend is production-ready with:
✅ Full authentication & authorization
✅ Real-time telemetry via Socket.IO
✅ Pathfinding algorithms (Dijkstra + TSP)
✅ AI mission planning (Gemini)
✅ Revenue tracking & analytics
✅ Comprehensive logging
✅ Docker support
