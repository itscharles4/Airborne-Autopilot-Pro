# Airborne Autopilot Pro — Complete API Reference

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Rate Limiting

- General API: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes

---

## Auth Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "OPERATOR"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "john@example.com", "role": "OPERATOR" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@charronix.com",
  "password": "Admin@123"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "admin@charronix.com", "role": "ADMIN" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@charronix.com",
    "role": "ADMIN",
    "lastLogin": "2025-03-01T10:30:00Z",
    "isActive": true
  }
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Drone Endpoints

### Get All Drones
```http
GET /drones
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "id": "Alpha-1",
      "name": "Alpha-1",
      "model": "DJI Mavic 3",
      "status": "IDLE",
      "battery": 100,
      "position": { "x": 100, "y": 100, "z": 0 },
      "speed": 0,
      "health": { "score": 85, "grade": "B" }
    }
  ]
}
```

### Get Drone by ID
```http
GET /drones/Alpha-1
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": "Alpha-1",
    "name": "Alpha-1",
    "model": "DJI Mavic 3",
    "status": "IDLE",
    "battery": 100,
    "position": { "x": 100, "y": 100, "z": 0 },
    "speed": 0,
    "maxAltitude": 120,
    "flightHours": 45,
    "errorRate": 2,
    "stability": 95,
    "health": { "score": 85, "grade": "B" }
  }
}
```

### Get Drone Health
```http
GET /drones/Alpha-1/health
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "droneId": "Alpha-1",
    "score": 85,
    "grade": "B",
    "breakdown": {
      "battery": { "value": 100, "score": 35, "weight": 35 },
      "maintenance": { "value": 45, "score": 16.5, "weight": 30 },
      "errorRate": { "value": 2, "score": 19.6, "weight": 20 },
      "stability": { "value": 95, "score": 14.25, "weight": 15 }
    },
    "recommendations": []
  }
}
```

### Get Available Drones
```http
GET /drones/available
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "count": 3,
  "data": [ /* drone objects with battery >= 30% and status IDLE */ ]
}
```

### Create Drone
```http
POST /drones
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "Echo-5",
  "name": "Echo-5",
  "model": "DJI Air 2S",
  "battery": 100,
  "status": "IDLE",
  "position": { "x": 0, "y": 0, "z": 0 }
}
```

**Response:** 201 Created

### Update Drone
```http
PUT /drones/Echo-5
Authorization: Bearer <token>
Content-Type: application/json

{
  "battery": 80,
  "status": "CHARGING"
}
```

**Response:** 200 OK

### Delete Drone
```http
DELETE /drones/Echo-5
Authorization: Bearer <token>
```

**Response:** 204 No Content

### Send Drone Command
```http
POST /drones/Alpha-1/command
Authorization: Bearer <token>
Content-Type: application/json

{
  "command": "RETURN_HOME"
}
```

Valid commands: `RETURN_HOME`, `EMERGENCY_LAND`, `START_CHARGING`, `SET_IDLE`

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Command RETURN_HOME sent",
  "data": { /* updated drone */ }
}
```

---

## Order Endpoints

### Get All Orders
```http
GET /orders?status=PENDING&page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by status (PENDING, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED)
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 20)

**Response:** 200 OK
```json
{
  "success": true,
  "count": 5,
  "total": 15,
  "page": 1,
  "data": [ /* order objects */ ]
}
```

### Create Order
```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerName": "John Smith",
  "customerEmail": "john@example.com",
  "pickupLocation": "Depot",
  "deliveryLocation": "Hospital",
  "pickupNode": 0,
  "deliveryNode": 1,
  "packageWeight": 2.5,
  "priority": "EXPRESS",
  "packageType": "MEDICAL"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "customerName": "John Smith",
    "status": "ASSIGNED",
    "price": 150,
    "droneAssigned": "Alpha-1",
    "estimatedETA": "5 minutes",
    "path": [0, 1],
    "totalDistance": 6
  }
}
```

### Get Order by ID
```http
GET /orders/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response:** 200 OK

### Track Order
```http
GET /orders/507f1f77bcf86cd799439011/track
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "status": "IN_TRANSIT",
    "droneId": "Alpha-1",
    "dronePosition": { "x": 150, "y": 175, "z": 50 },
    "droneBattery": 85,
    "estimatedETA": "5 minutes",
    "path": [0, 1, 2]
  }
}
```

### Complete Order
```http
PUT /orders/507f1f77bcf86cd799439011/complete
Authorization: Bearer <token>
```

**Response:** 200 OK

### Cancel Order
```http
PUT /orders/507f1f77bcf86cd799439011/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Customer requested cancellation"
}
```

**Response:** 200 OK

---

## Pathfinder Endpoints

### Compute Dijkstra Path
```http
POST /pathfinder/dijkstra
Authorization: Bearer <token>
Content-Type: application/json

{
  "start": 0,
  "end": 5,
  "avoid": [3, 4]
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "cached": false,
  "data": {
    "path": [0, 1, 2, 5],
    "pathNames": ["Depot", "Hospital", "Mall", "Downtown"],
    "totalDistance": 12,
    "estimatedTime": 336,
    "waypoints": [{ "x": 100, "y": 100 }, { "x": 200, "y": 150 }, ...],
    "algorithm": "Dijkstra"
  }
}
```

### Compute TSP (Traveling Salesman)
```http
POST /pathfinder/tsp
Authorization: Bearer <token>
Content-Type: application/json

{
  "stops": [0, 5, 10, 15],
  "algorithm": "auto"
}
```

**Algorithm:** `auto` (auto-selects), `brute` (exact, only for ≤8 stops), `nearest` (heuristic)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "tour": [0, 1, 5, 10, 15],
    "totalDistance": 25.6,
    "estimatedTime": 716,
    "segments": [ /* path segments */ ],
    "algorithm": "Nearest-Neighbor TSP"
  }
}
```

### Get Delivery Network Graph
```http
GET /pathfinder/graph
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": 0, "name": "Depot", "x": 100, "y": 100 },
      { "id": 1, "name": "Hospital", "x": 200, "y": 150 }
    ],
    "edges": [
      { "from": 0, "to": 1, "weight": 4, "noFly": false }
    ],
    "noFlyZones": [3, 7]
  }
}
```

### Set No-Fly Zones
```http
PUT /pathfinder/graph/nofly
Authorization: Bearer <token>
Content-Type: application/json

{
  "nodes": [3, 7, 12],
  "action": "add"
}
```

**Action:** `add` or `remove`

**Response:** 200 OK

---

## Flight Endpoints

### Get All Flights
```http
GET /flights?page=1&limit=20&droneId=Alpha-1
Authorization: Bearer <token>
```

**Response:** 200 OK

### Get Flight by ID
```http
GET /flights/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "droneId": "Alpha-1",
    "orderId": "...",
    "status": "FLYING",
    "progress": 45,
    "telemetry": [ /* telemetry ticks */ ],
    "totalDistance": 12,
    "startTime": "2025-03-01T10:00:00Z"
  }
}
```

### Get Flight Replay
```http
GET /flights/507f1f77bcf86cd799439011/replay
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "flightId": "507f1f77bcf86cd799439011",
    "droneId": "Alpha-1",
    "totalTicks": 120,
    "ticks": [
      { "tick": 0, "x": 100, "y": 100, "z": 0, "battery": 95, "timestamp": "..." },
      { "tick": 1, "x": 102, "y": 101, "z": 5, "battery": 94.95, "event": null }
    ],
    "events": [
      { "tick": 10, "type": "TAKEOFF" },
      { "tick": 119, "type": "LANDED" }
    ]
  }
}
```

### Get Active Flights
```http
GET /flights/active
Authorization: Bearer <token>
```

**Response:** 200 OK

### Complete Flight
```http
PUT /flights/507f1f77bcf86cd799439011/complete
Authorization: Bearer <token>
```

**Response:** 200 OK

---

## Revenue Endpoints

### Get Revenue Summary
```http
GET /revenue/summary?period=weekly
Authorization: Bearer <token>
```

**Query Parameters:**
- `period`: `weekly` or `monthly`

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "totalRevenue": 2500,
    "totalCost": 1000,
    "netProfit": 1500,
    "totalDeliveries": 25,
    "profitMargin": 60,
    "revenueGrowth": 15,
    "deliveryGrowth": 10
  }
}
```

### Get Revenue by Drone
```http
GET /revenue/drones
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    { "_id": "Alpha-1", "revenue": 1000, "cost": 400, "profit": 600, "deliveries": 10 }
  ]
}
```

### Get Cost Breakdown
```http
GET /revenue/costs
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "battery": 300,
    "maintenance": 200,
    "depreciation": 150,
    "operations": 350
  }
}
```

### Get Daily Revenue Data
```http
GET /revenue/daily?days=7
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    { "_id": "2025-03-01", "revenue": 500, "cost": 200, "profit": 300, "deliveries": 5 }
  ]
}
```

### Export Revenue as CSV
```http
GET /revenue/export
Authorization: Bearer <token>
```

**Response:** 200 OK (CSV file download)

---

## Mission Endpoints

### Get Mission Templates
```http
GET /missions/templates
Authorization: Bearer <token>
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "label": "Emergency Medical Sweep",
      "prompt": "Deploy all available drones..."
    }
  ]
}
```

### Plan AI Mission
```http
POST /missions/plan
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Deploy 2 drones for emergency relief delivery to Hospital and Clinic"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "missionTitle": "Emergency Relief Deployment",
    "objective": "Deliver emergency supplies...",
    "totalDrones": 2,
    "estimatedDuration": "30 minutes",
    "riskLevel": "LOW",
    "stops": [
      { "nodeId": 1, "name": "Hospital", "task": "Deliver supplies", "priority": 1 }
    ],
    "droneAssignments": [
      { "droneId": "Alpha-1", "stops": [0, 1, 6] }
    ]
  }
}
```

### Deploy Mission
```http
POST /missions/deploy
Authorization: Bearer <token>
Content-Type: application/json

{
  "missionPlan": { /* mission plan object */ }
}
```

**Response:** 200 OK

---

## Alert Endpoints

### Get Alerts
```http
GET /alerts?droneId=Alpha-1&resolved=false&severity=CRITICAL
Authorization: Bearer <token>
```

**Query Parameters:**
- `droneId`: Filter by drone
- `resolved`: `true`, `false`, or both if omitted
- `severity`: `INFO`, `WARNING`, `CRITICAL`

**Response:** 200 OK
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "droneId": "Alpha-1",
      "type": "BATTERY",
      "severity": "WARNING",
      "message": "Battery low: 20%",
      "resolved": false
    }
  ]
}
```

### Create Alert
```http
POST /alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "droneId": "Beta-2",
  "type": "BATTERY",
  "severity": "CRITICAL",
  "message": "Critical battery - immediate landing required"
}
```

**Response:** 201 Created

### Resolve Alert
```http
PUT /alerts/507f1f77bcf86cd799439011/resolve
Authorization: Bearer <token>
```

**Response:** 200 OK

### Delete Alert
```http
DELETE /alerts/507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Response:** 204 No Content

---

## Socket.IO Events

### Connection
```javascript
socket.emit('subscribe:fleet');
socket.emit('subscribe:drone', { droneId: 'Alpha-1' });
```

### Listening
```javascript
socket.on('fleet:update', (data) => { /* all drones */ });
socket.on('drone:telemetry', (data) => { /* single drone */ });
socket.on('drone:alert', (alert) => { /* new alert */ });
socket.on('collision:warning', (warning) => { /* collision risk */ });
socket.on('health:update', (health) => { /* health score */ });
socket.on('revenue:tick', (revenue) => { /* revenue update */ });
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid input"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided",
  "code": "TOKEN_EXPIRED"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden: requires permissions [drones:write]",
  "yourRole": "VIEWER"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Drone not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Testing

Use curl or Postman:

```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@charronix.com","password":"Admin@123"}'

# Get Drones
curl -X GET http://localhost:5000/api/v1/drones \
  -H "Authorization: Bearer <token>"
```
