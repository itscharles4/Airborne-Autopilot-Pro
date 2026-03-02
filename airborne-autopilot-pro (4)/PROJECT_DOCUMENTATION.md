# Airborne Autopilot Pro - Project Documentation

## Project Overview

**Airborne Autopilot Pro** is a modern React-based drone fleet management and visualization system with AI-powered intelligence capabilities. It provides real-time monitoring, fleet control, airspace visualization, and media intelligence features for autonomous drone operations.

**Technology Stack:**
- **Frontend**: React 19.2.4 with TypeScript
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS with custom styling
- **Visualization**: Recharts, 3D Canvas rendering
- **AI/ML**: Google Gemini API integration
- **Icons**: Lucide React

---

## Project Structure

```
airborne-autopilot-pro (4)/
├── App.tsx                 # Main application container
├── index.tsx               # React entry point
├── index.html              # HTML template
├── types.ts                # TypeScript type definitions
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
├── .env.local              # Environment variables (local)
├── metadata.json           # Application metadata
├── components/
│   ├── LoginPage.tsx       # Authentication interface
│   ├── Dashboard.tsx       # System overview & analytics
│   ├── FleetManager.tsx    # Drone fleet control
│   ├── AirspaceView.tsx    # 3D airspace visualization
│   └── MediaProcessor.tsx  # AI image enhancement
└── services/
    └── geminiService.ts    # Google Gemini API integration
```

---

## Core Type Definitions (`types.ts`)

### Enums

**DroneStatus**
- `IDLE` - Drone is stationary and ready
- `FLYING` - Drone is actively in flight
- `CHARGING` - Drone is connected to power
- `MAINTENANCE` - Drone is under maintenance
- `EMERGENCY` - Drone triggered emergency protocol

**ViewType**
- `'3D'` - Airspace Visualizer
- `'FLEET'` - Fleet Manager
- `'FLIGHTS'` - Flight Controls
- `'DASHBOARD'` - System Dashboard
- `'MEDIA'` - Media Intelligence

### Interfaces

**Position**
```typescript
{ x: number; y: number; z: number }
```

**Drone**
- `id`: Unique identifier
- `name`: Display name
- `model`: Drone model (CZ4-Heavy, CZ4-Light, etc.)
- `status`: Current drone status
- `battery`: Battery percentage (0-100)
- `position`: 3D coordinates
- `speed`: Current velocity
- `maxAltitude`: Maximum operating altitude
- `lastUpdated`: ISO timestamp of last update
- `path?`: Optional waypoint array

**Alert**
- `id`: Alert identifier
- `type`: COLLISION, SYSTEM, BATTERY, or WEATHER
- `severity`: LOW, MEDIUM, HIGH, or CRITICAL
- `message`: Alert description
- `timestamp`: When alert occurred

**Flight**
- `id`: Flight identifier
- `droneId`: Associated drone ID
- `pathId`: Flight path ID
- `status`: PENDING, IN_PROGRESS, COMPLETED, or CANCELLED
- `progress`: Completion percentage
- `startTime`: ISO start timestamp
- `estimatedDuration`: Flight duration in minutes

---

## Components

### 1. **App.tsx** - Main Application Container

The root component that orchestrates the entire application.

**Key Features:**
- Authentication state management
- View/navigation system with sidebar
- Drone telemetry simulation (battery drain at 0.05% every 2 seconds)
- Emergency status trigger when battery < 10%
- Dynamic view rendering based on active tab

**Initial Drones:**
- Alpha-1 (CZ4-Heavy): Flying, 84.2% battery
- Beta-2 (CZ4-Light): Flying, 91.1% battery
- Gamma-3 (CZ4-Heavy): Idle, 100% battery
- Delta-4 (CZ5-Nano): Flying, 12.5% battery (LOW)

**Navigation Structure:**
```
Sidebar Navigation:
├─ OPERATIONAL
│  ├─ Airspace Visualizer (3D View)
│  ├─ Fleet Manager (FLEET View)
│  └─ Flight Controls (FLIGHTS View)
└─ INTELLIGENCE
   ├─ Media Intelligence (MEDIA View)
   └─ System Dashboard (DASHBOARD View)
```

---

### 2. **LoginPage.tsx** - Authentication Interface

Provides secure access to the flight control system.

**Features:**
- Username/Operational ID input
- Password/Security Key input
- Loading state with spinner animation
- 1.2-second auth delay simulation
- Quantum encryption branding
- Emergency bypass mode button (UI only)

**Props:**
- `onLogin`: Callback function when authentication succeeds

**Styling:**
- Dark theme with cyber aesthetic
- Glass-morphism UI elements
- Animated decorative orbs in background
- Glowing shadow effects

---

### 3. **Dashboard.tsx** - System Overview & Analytics

Real-time system telemetrics and computational performance monitoring.

**Features:**
- **Top Metrics Cards:**
  - CPU Utilization (14.2%)
  - Memory Load (41.8%)
  - Network Latency (12ms)
  - System Health (Optimal)

- **Computational Performance Chart:**
  - Area chart using Recharts
  - Displays CPU, Memory, and Latency trends
  - 20-point mock data with random values
  - 60-second auto-refresh interval

- **AI Insights Panel:**
  - Integrates Gemini API for airspace safety analysis
  - Analyzes drone positions and alerts
  - Displays 2-sentence safety recommendations
  - Quota-exhausted error handling with retry logic

**Props:**
- `drones`: Array of Drone objects for analysis

---

### 4. **FleetManager.tsx** - Drone Fleet Control

Comprehensive fleet management interface with real-time monitoring.

**Features:**
- **Fleet Statistics:**
  - Total Assets count
  - Operational drones count
  - Low battery warning count
  - Network Health status

- **Fleet Table Display:**
  - Drone identification and model info
  - Real-time status indicators (color-coded)
  - Battery percentage with visual bar
  - 3D position coordinates (X, Y, Z)
  - Last communication timestamp
  - Context menu (Settings, Delete)

- **Deployment Modal:**
  - Add new drone form
  - Input fields: ID, Name, Target X, Target Z
  - Creates new Drone with default specs
  - Modal overlay with backdrop blur

**Props:**
- `drones`: Array of active drones
- `onAddDrone`: Callback to add new drone

**Visual Elements:**
- Status badges (color-coded by state)
- Battery indicators with gradient fill
- Hover effects on table rows
- Context menu buttons appear on hover

---

### 5. **AirspaceView.tsx** - 3D Airspace Visualization

Advanced 3D visualization system for airspace monitoring and collision detection.

**Features:**

- **3D Building Generation:**
  - Procedurally generated urban environment
  - 4 logistics hubs (corner positions)
  - Mix of building types: RESIDENTIAL, COMMERCIAL, MEDICAL, INDUSTRIAL
  - Variable heights based on distance from center
  - Shadow and lighting effects

- **Building Types:**
  - RESIDENTIAL: Home icon
  - COMMERCIAL: Office building icon
  - MEDICAL: Heart pulse icon
  - INDUSTRIAL: Factory icon
  - LOGISTICS: Box icon (hubs with special styling)

- **Drone Visualization:**
  - Real-time drone positions on 3D canvas
  - Speed indicators
  - Battery status visualization
  - Flight path display with waypoints

- **Collision Detection:**
  - 40-unit collision threshold
  - Alert generation on proximity
  - Visual warnings (red highlights)

- **Interactive Features:**
  - Building hover effects (highlights and scales)
  - Landmark information overlay
  - Search and filter functionality
  - Radar scanning visualization
  - Building type filtering

- **Canvas Rendering:**
  - 3D perspective transformation
  - GPU-accelerated rendering
  - Smooth animations and transitions
  - Anti-aliasing support

**Props:**
- `drones`: Array of Drone objects for visualization

---

### 6. **MediaProcessor.tsx** - AI Image Enhancement

Drone feed enhancement and tactical analysis using Gemini AI.

**Features:**

- **Image Management:**
  - Upload drone feed imagery
  - Real-time image preview
  - Edit history tracking (undo functionality)
  - Download enhanced images

- **AI Enhancement Controls:**
  - Natural language prompt input
  - Process status indicator
  - Disabled state when processing

- **Quick Presets:**
  - Pre-configured enhancement commands
  - One-click application
  - Examples: Retro cinematic filter, Remove fog, Boost saturation, Monochrome view

- **Processing:**
  - Integrates with Gemini 2.5 Flash Image model
  - Base64 image encoding
  - MIME type detection
  - Quota error handling with retry

- **UI Elements:**
  - Image viewport with loading overlay
  - Textarea for custom prompts
  - Download button (visible on hover)
  - History tracking with undo

**State Management:**
- `image`: Current displayed image
- `processing`: Loading state
- `prompt`: User input text
- `history`: Array of image versions for undo

---

## Services

### **geminiService.ts** - Google Gemini API Integration

Provides AI-powered analysis and image processing capabilities.

**Functions:**

#### `withRetry<T>(fn, retries = 2, delay = 5000)`
- Generic retry utility with exponential backoff
- Handles 429 quota exhaustion errors
- Doubles delay between retries
- Returns retry attempts remaining in console

#### `analyzeAirspaceSafety(drones, alerts)`
- Model: `gemini-3-flash-preview`
- System Instruction: "Professional Air Traffic Controller"
- Input: Drone telemetry and alert data
- Output: 2-sentence safety recommendation
- Temperature: 0.7 (balanced creativity)

#### `searchNearbyPlaces(lat, lng)`
- Model: `gemini-2.5-flash`
- Uses Google Maps grounding tool
- Identifies top 5 infrastructure hubs
- Returns text analysis and grounding metadata chunks
- Location-based drone logistics mapping

#### `editImage(base64Image, prompt, mimeType)`
- Model: `gemini-2.5-flash-image`
- Accepts base64-encoded image data
- Processes natural language enhancement prompts
- Returns modified image as base64
- Supports any standard image format

**Error Handling:**
- Quota exhaustion detection (429 status)
- Automatic retry with exponential backoff
- Console error logging
- Graceful fallback messages

**Environment:**
- Requires `API_KEY` environment variable
- Set in `.env.local` file

---

## Application Flow

### 1. **Initialization**
```
App Component Loads
    ↓
Check Login State
    ↓
If Not Logged In → Display LoginPage
If Logged In → Display Main Interface
```

### 2. **Navigation Flow**
```
User Clicks Navigation Item
    ↓
Update Active View State
    ↓
Render Appropriate Component
    ↓
Update Sidebar Highlight
```

### 3. **Telemetry Update Loop**
```
Every 2 seconds (if logged in):
    ↓
For Each Flying Drone:
    - Decrease battery by 0.05%
    - Check if battery < 10% → Set to EMERGENCY
    - Update drone state
```

### 4. **Dashboard Analysis Flow**
```
Dashboard Component Mounts
    ↓
Fetch Initial Airspace Safety Analysis
    ↓
Every 60 seconds: Re-analyze traffic
    ↓
Display AI Insights in Panel
```

### 5. **Media Processing Flow**
```
User Selects Image
    ↓
Convert to Base64
    ↓
User Enters Modification Prompt
    ↓
Send to Gemini API
    ↓
Display Result & Add to History
    ↓
User Can Undo or Download
```

---

## Styling & Theme

### Color Palette
- **Primary**: Sky-600 (`#0ea5e9`)
- **Background**: Dark slate (`#0a0a0b`)
- **Surface**: Slate-800 to Slate-900
- **Accent**: Emerald (success), Rose (error), Amber (warning)
- **Text**: Slate-200 to Slate-400

### UI Patterns
- Glass-morphism: Semi-transparent backgrounds with blur
- Gradient backgrounds: Linear and radial gradients
- Shadow effects: Glowing shadows for emphasis
- Animations: Smooth transitions, pulse effects, spin animations
- Responsive: Grid-based layouts that adapt to screen size

### Tailwind CSS Classes
- Custom utilities for glass effect
- Dark mode enabled (default)
- Extended color palette
- Custom animations (pulse, spin, ping)

---

## Key Features Summary

| Feature | Component | Status |
|---------|-----------|--------|
| 3D Airspace Visualization | AirspaceView | ✓ Active |
| Fleet Management | FleetManager | ✓ Active |
| Real-time Telemetry | App (simulation) | ✓ Simulated |
| System Dashboard | Dashboard | ✓ Active |
| AI Image Enhancement | MediaProcessor | ✓ Active |
| Gemini Integration | geminiService | ✓ Active |
| Collision Detection | AirspaceView | ✓ Active |
| Battery Monitoring | FleetManager, App | ✓ Active |
| Authentication | LoginPage | ✓ Basic |
| Responsive Design | All | ✓ Active |

---

## Environment Configuration

Required `.env.local` file:
```
API_KEY=your_google_gemini_api_key_here
```

---

## Development Scripts

- `npm run dev` - Start Vite development server (localhost:3000)
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

---

## Dependencies

**Runtime:**
- `react@^19.2.4` - UI framework
- `react-dom@^19.2.4` - DOM rendering
- `@google/genai@^1.40.0` - Gemini API client
- `lucide-react@^0.563.0` - Icon library
- `recharts@^3.7.0` - Chart library

**Development:**
- `typescript@~5.8.2` - Type checking
- `vite@^6.2.0` - Build tool
- `@vitejs/plugin-react@^5.0.0` - React plugin
- `@types/node@^22.14.0` - Node type definitions

---

## Performance Considerations

1. **Telemetry Updates**: Throttled to 2-second intervals
2. **AI Analysis**: Cached and refreshed every 60 seconds
3. **3D Rendering**: Uses CSS 3D transforms (GPU-accelerated)
4. **Image Processing**: Base64 encoding for API transmission
5. **Retry Logic**: Exponential backoff for API quota handling

---

## Future Enhancement Opportunities

- [ ] Real database integration (replace simulation)
- [ ] WebSocket for live drone updates
- [ ] Advanced pathfinding algorithms
- [ ] Multi-user collaboration
- [ ] Custom alert thresholds
- [ ] Drone maintenance scheduling
- [ ] Weather integration
- [ ] Analytics export/reporting
- [ ] Mobile responsive improvements
- [ ] Video stream support

---

## Notes

- Battery drain simulation: 0.05% per 2 seconds (~2.4% per minute)
- Emergency threshold: 10% battery
- Collision detection threshold: 40 units between drones
- Chart auto-refresh: 60 seconds for dashboard analysis
- Max retry attempts: 2 with exponential backoff
- Login simulation delay: 1200ms

