
export enum DroneStatus {
  IDLE = 'IDLE',
  FLYING = 'FLYING',
  CHARGING = 'CHARGING',
  MAINTENANCE = 'MAINTENANCE',
  EMERGENCY = 'EMERGENCY'
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Waypoint extends Position {
  id: string;
}

export interface Drone {
  id: string;
  name: string;
  model: string;
  status: DroneStatus;
  battery: number;
  position: Position;
  speed: number;
  maxAltitude: number;
  lastUpdated: string;
  path?: Waypoint[];
}

export interface Flight {
  id: string;
  droneId: string;
  pathId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  startTime: string;
  estimatedDuration: number;
}

export interface Alert {
  id: string;
  type: 'COLLISION' | 'SYSTEM' | 'BATTERY' | 'WEATHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
}

export type ViewType = '3D' | 'FLEET' | 'FLIGHTS' | 'DASHBOARD' | 'MEDIA' | 'HEALTH' | 'MISSION' | 'ROUTES' | 'REPLAY' | 'REVENUE' | 'MAINTENANCE';
