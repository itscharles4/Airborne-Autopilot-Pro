<div align="center">

<img src="https://img.shields.io/badge/Airborne-Autopilot%20Pro-0ea5e9?style=for-the-badge&logo=drone&logoColor=white" alt="Airborne Autopilot Pro" height="40"/>

# 🚁 Airborne Autopilot Pro

**An AI-powered, full-stack Drone Fleet Management System with real-time telemetry, 3D airspace visualization, and intelligent mission planning.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?style=flat-square&logo=socketdotio)](https://socket.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [DSA Algorithms](#-dsa-algorithms)
- [Real-Time Architecture](#-real-time-architecture)
- [Testing](#-testing)
- [Docker Deployment](#-docker-deployment)
- [Screenshots](#-screenshots)
- [Team](#-team)

---

## 🌟 Overview

**Airborne Autopilot Pro** is a comprehensive drone fleet management platform developed as a Software Engineering & Data Structures project. It combines:

- A **React + TypeScript** frontend with 3D airspace visualization (Three.js)
- A **Node.js/Express** backend with real-time Socket.IO telemetry
- **AI-powered** mission planning via Google Gemini API
- **Classical DSA algorithms** (Dijkstra, TSP) for optimal route computation
- **Digital Twin simulation** for drone behavior modeling
- **Predictive maintenance** analytics

The system manages a fleet of drones from takeoff to landing — tracking position, battery, health, orders, and revenue in real time.

---

## ✨ Features

### 🗺️ Operational
| Feature | Description |
|---|---|
| **3D Airspace Visualizer** | Live Three.js 3D map showing all drones, flight paths, and geofences |
| **Fleet Manager** | Add, update, and monitor all drones with live battery & status indicators |
| **Flight Controls / Mission Launcher** | Plan and deploy missions with waypoints and priority settings |

### 🤖 Intelligence
| Feature | Description |
|---|---|
| **AI Mission Planner** | Gemini-powered mission planning with natural language instructions |
| **Media Intelligence** | Upload and analyze drone-captured images and video with AI |
| **System Dashboard** | Real-time KPIs, fleet health summaries, and alert feeds |

### 🔬 Advanced
| Feature | Description |
|---|---|
| **Drone Health Score** | ML-style scoring of each drone based on battery, flight hours & sensor status |
| **Route Optimizer (TSP)** | Traveling Salesman Problem solver for multi-stop delivery routes |
| **Flight Replay** | Scrub through historical flight paths frame by frame |
| **Revenue & Analytics** | Revenue tracking per drone with CSV export |
| **Predictive Maintenance** | Forecast failure risks and schedule maintenance proactively |
| **Digital Twin Simulator** | Virtual drone models for testing before real deployment |
| **Weather Integration** | Condition-aware flight planning |
| **Geofence Management** | Define restricted airspace zones with auto-breach alerts |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite 6 | Build tool & dev server |
| Three.js + @react-three/fiber | 3D airspace visualization |
| Recharts | Revenue & analytics charts |
| Socket.IO Client | Real-time telemetry updates |
| Lucide React | Icon library |
| Google Maps JS API | Geographic mapping |
| Google Gemini API | AI mission planning & media analysis |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Primary database |
| Redis (ioredis) | Caching & pub/sub |
| Socket.IO | Real-time bidirectional events |
| JWT + bcrypt | Auth & security |
| Helmet + CORS | Security hardening |
| Winston | Structured logging |
| Jest + Supertest | Unit & integration testing |
| Docker + docker-compose | Containerized deployment |

---

## 📁 Project Structure

```
Airborne-Autopilot-Pro/
├── airborne-autopilot-pro (4)/    # 🖥️ Frontend (React + Vite + TypeScript)
│   ├── components/
│   │   ├── AirspaceView.tsx        # 3D Three.js drone map
│   │   ├── FleetManager.tsx        # Drone fleet table & controls
│   │   ├── Dashboard.tsx           # KPI system dashboard
│   │   ├── AIMissionPlanner.tsx    # Gemini AI mission planner
│   │   ├── TSPOptimizer.tsx        # Route optimization visualizer
│   │   ├── FlightReplay.tsx        # Historical flight scrubber
│   │   ├── RevenueDashboard.tsx    # Analytics & CSV export
│   │   ├── DroneHealthScore.tsx    # Health scoring dashboard
│   │   ├── PredictiveMaintenance.tsx
│   │   ├── MissionLaunchPlanner.tsx
│   │   ├── MediaProcessor.tsx      # AI media analysis
│   │   ├── LoginPage.tsx
│   │   └── SettingsModal.tsx
│   ├── services/
│   │   ├── geminiService.ts        # Gemini API integration
│   │   ├── googleMapsService.ts    # Maps API wrapper
│   │   ├── spatialAnalysis.ts      # Geospatial computations
│   │   └── buildingGenerator.ts   # 3D city building generator
│   ├── types.ts                    # Shared TypeScript types
│   ├── App.tsx                     # Root app with routing
│   └── vite.config.ts
│
├── airborne-autopilot-backend/    # ⚙️ Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB + Redis connection
│   │   ├── models/
│   │   │   ├── Drone.js           # Drone schema
│   │   │   ├── Flight.js          # Flight record schema
│   │   │   ├── Order.js           # Delivery order schema
│   │   │   ├── Alert.js           # System alert schema
│   │   │   ├── Geofence.js        # Geofence zone schema
│   │   │   └── DigitalTwin.js     # Digital twin schema
│   │   ├── routes/
│   │   │   ├── auth.js            # Authentication endpoints
│   │   │   ├── drones.js          # Fleet management endpoints
│   │   │   ├── orders.js          # Delivery order endpoints
│   │   │   ├── flights.js         # Flight record endpoints
│   │   │   ├── missions.js        # AI mission endpoints
│   │   │   ├── revenue.js         # Analytics endpoints
│   │   │   └── advanced.js        # Advanced feature endpoints
│   │   ├── services/
│   │   │   ├── telemetryEngine.js      # Live drone telemetry
│   │   │   ├── advancedPathfinding.js  # Dijkstra + TSP
│   │   │   ├── digitalTwinSimulator.js # Virtual drone modeling
│   │   │   ├── weatherService.js       # Weather data integration
│   │   │   ├── aiService.js            # AI orchestration
│   │   │   ├── geminiService.js        # Gemini API wrapper
│   │   │   └── memoryStore.js          # In-memory fallback store
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT verification + RBAC
│   │   ├── sockets/
│   │   │   ├── socketHandler.js   # Socket.IO event handlers
│   │   │   └── telemetrySimulator.js  # Simulated telemetry feed
│   │   └── server.js              # Entry point
│   └── tests/
│
├── docker-compose.yml             # Full stack Docker setup
├── DOCUMENTATION_INDEX.md        # Docs index
└── README.md                     # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **MongoDB** 7+ (local or [Atlas](https://cloud.mongodb.com))
- **Redis** 7+ (local or [Upstash](https://upstash.com))
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/itscharles4/Airborne-Autopilot-Pro.git
cd Airborne-Autopilot-Pro
```

### 2. Start the Backend

```bash
cd "airborne-autopilot-backend"
npm install
cp .env.example .env     # Edit with your values (see below)
npm run seed             # Seed 5 sample drones
npm run dev              # Starts on http://localhost:5000
```

### 3. Start the Frontend

```bash
cd "airborne-autopilot-pro (4)"
npm install
# Add GEMINI_API_KEY to .env.local
npm run dev              # Starts on http://localhost:5173
```

Open **http://localhost:5173** and log in with the demo credentials.

---

## 🔐 Environment Variables

### Backend — `airborne-autopilot-backend/.env`

```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/airborne_autopilot
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# AI
GEMINI_API_KEY=your_google_gemini_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend — `airborne-autopilot-pro (4)/.env.local`

```env
VITE_GEMINI_API_KEY=your_google_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_URL=http://localhost:5000
```

> ⚠️ Never commit `.env` files. They are excluded by `.gitignore`.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login & receive JWT |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user profile |

### Drones
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/drones` | List all drones |
| POST | `/api/v1/drones` | Register new drone |
| GET | `/api/v1/drones/:id` | Get drone by ID |
| PUT | `/api/v1/drones/:id` | Update drone |
| DELETE | `/api/v1/drones/:id` | Delete drone |
| GET | `/api/v1/drones/:id/health` | Get health score |
| POST | `/api/v1/drones/:id/command` | Send command to drone |

### Missions & Pathfinding
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/missions/plan` | AI-generate a mission plan |
| POST | `/api/v1/missions/deploy` | Deploy a mission |
| POST | `/api/v1/pathfinder/dijkstra` | Shortest path computation |
| POST | `/api/v1/pathfinder/tsp` | TSP multi-stop optimization |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/revenue/summary` | Total revenue summary |
| GET | `/api/v1/revenue/drones` | Revenue breakdown per drone |
| GET | `/api/v1/revenue/export` | Export data as CSV |
| GET | `/api/v1/flights/:id/replay` | Flight path replay data |

> See [`airborne-autopilot-backend/API_REFERENCE.md`](airborne-autopilot-backend/API_REFERENCE.md) for full API docs.

---

## 🧮 DSA Algorithms

A core part of this project as a Software Engineering + DSA course submission:

### Dijkstra's Shortest Path
> **File:** `src/services/advancedPathfinding.js`

Used to find the **minimum-cost route** between two delivery nodes in the drone network graph. Each edge is weighted by distance, wind resistance, and no-fly zone penalties.

```
Time Complexity: O((V + E) log V)  — Priority queue (min-heap)
Space Complexity: O(V)
```

### Traveling Salesman Problem (TSP) — Nearest Neighbor Heuristic
> **File:** `src/services/advancedPathfinding.js` · **UI:** `TSPOptimizer.tsx`

Used for **multi-stop delivery optimization**. When a drone must deliver to multiple destinations, TSP determines the most efficient visit order, reducing total distance traveled.

```
Algorithm: Nearest Neighbor Heuristic (greedy approximation)
Time Complexity: O(n²)
Optimization: 2-opt local search post-processing
```

### Real-Time Telemetry Engine
> **File:** `src/services/telemetryEngine.js`

A priority-queue based event system that schedules telemetry updates, battery drain calculations, and alert triggers across the entire drone fleet.

---

## ⚡ Real-Time Architecture

```
Browser (React)
    │
    │  WebSocket (Socket.IO)
    ▼
Backend Server (Express)
    │
    ├──► TelemetryEngine ──► MongoDB (flight logs)
    ├──► Redis Pub/Sub    ──► alert broadcasting
    └──► Socket.IO events ──► connected clients
```

**Socket Events:**
| Event | Direction | Description |
|---|---|---|
| `telemetry:update` | Server → Client | Live drone position & battery |
| `alert:new` | Server → Client | New system alert |
| `fleet:update` | Server → Client | Fleet status change |
| `mission:status` | Server → Client | Mission progress update |
| `drone:command` | Client → Server | Send command to drone |

---

## 🧪 Testing

### Backend Tests
```bash
cd airborne-autopilot-backend
npm test                  # Run all Jest tests with coverage
```

Tests cover:
- Drone model validation
- Pathfinding algorithm correctness
- API endpoint integration tests

### Frontend E2E (Selenium)
```bash
cd "airborne-autopilot-pro (4)"
pip install selenium webdriver-manager
python selenium_test.py
```

See [`selenium_report.md`](airborne-autopilot-pro%20(4)/selenium_report.md) for the latest test results.

---

## 🐳 Docker Deployment

Start the entire stack (API + MongoDB + Redis) with one command:

```bash
docker-compose up -d
```

**Services started:**
| Container | Port | Description |
|---|---|---|
| `api` | 5000 | Express backend |
| `mongo` | 27017 | MongoDB database |
| `redis` | 6379 | Redis cache |

To stop:
```bash
docker-compose down
```

---

## 👥 Roles & Permissions

| Role | Permissions |
|---|---|
| **ADMIN** | Full system access — manage drones, users, configs |
| **OPERATOR** | Manage drones, create/complete orders |
| **ANALYST** | View data, generate reports, export CSV |
| **VIEWER** | Read-only access to drones & flight info |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "feat: add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ as a Software Engineering & DSA course project

**[⭐ Star this repo](https://github.com/itscharles4/Airborne-Autopilot-Pro)** if you found it helpful!

</div>
