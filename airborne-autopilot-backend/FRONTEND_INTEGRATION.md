// How to Integrate with Frontend (App.tsx)

import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000/api/v1';
let socket: Socket;

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [drones, setDrones] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Step 1: Login
  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.accessToken);
        setUser(data.data.user);
        localStorage.setItem('token', data.data.accessToken);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Step 2: Fetch drones from API
  const fetchDrones = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/drones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDrones(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch drones:', error);
    }
  };

  // Step 3: Fetch orders from API
  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  // Step 4: Create order
  const createOrder = async (orderData: any) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrders();
      }
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  // Step 5: Subscribe to real-time updates
  useEffect(() => {
    if (!token) return;

    // Initialize Socket.IO
    socket = io('http://localhost:5000', {
      auth: { token },
      reconnection: true,
    });

    // Subscribe to fleet updates
    socket.emit('subscribe:fleet');

    // Listen for fleet updates
    socket.on('fleet:update', (data) => {
      setDrones(data.drones);
    });

    // Listen for drone telemetry
    socket.on('drone:telemetry', (telemetry) => {
      console.log('Telemetry:', telemetry);
    });

    // Listen for alerts
    socket.on('drone:alert', (alert) => {
      console.log('Alert:', alert);
      // Show toast/notification
    });

    // Listen for collision warnings
    socket.on('collision:warning', (warning) => {
      console.warn('Collision warning:', warning);
    });

    // Listen for order status updates
    socket.on('order:status', (update) => {
      console.log('Order status update:', update);
    });

    // Fetch initial data
    fetchDrones();
    fetchOrders();

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Step 6: Send drone command
  const sendCommand = async (droneId: string, command: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/drones/${droneId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (data.success) {
        console.log('Command sent:', data.message);
      }
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  };

  // Step 7: Get drone health
  const getDroneHealth = async (droneId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/drones/${droneId}/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        console.log('Drone health:', data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Failed to get drone health:', error);
    }
  };

  // Step 8: Compute path (Dijkstra)
  const computePath = async (start: number, end: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/pathfinder/dijkstra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ start, end }),
      });
      const data = await res.json();
      if (data.success) {
        console.log('Path:', data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Failed to compute path:', error);
    }
  };

  // Step 9: Plan mission with AI
  const planMission = async (prompt: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/missions/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success) {
        console.log('Mission plan:', data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Failed to plan mission:', error);
    }
  };

  // Step 10: Get flight replay
  const getFlightReplay = async (flightId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/flights/${flightId}/replay`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        console.log('Flight replay:', data.data);
        return data.data;
      }
    } catch (error) {
      console.error('Failed to get flight replay:', error);
    }
  };

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}

// Example Usage in Components:

// 1. Login Form
export function LoginComponent() {
  const handleSubmit = (email: string, password: string) => {
    handleLogin(email, password);
  };

  return (
    <div>
      <h2>Login</h2>
      {/* Login form */}
    </div>
  );
}

// 2. Drones Dashboard
export function DronesDashboard({ drones }: { drones: any[] }) {
  return (
    <div>
      <h2>Active Drones ({drones.length})</h2>
      {drones.map(drone => (
        <div key={drone.id}>
          <h3>{drone.name}</h3>
          <p>Battery: {drone.battery}%</p>
          <p>Status: {drone.status}</p>
          <button onClick={() => sendCommand(drone.id, 'RETURN_HOME')}>
            Return Home
          </button>
        </div>
      ))}
    </div>
  );
}

// 3. Orders List
export function OrdersList({ orders }: { orders: any[] }) {
  return (
    <div>
      <h2>Orders ({orders.length})</h2>
      {orders.map(order => (
        <div key={order._id}>
          <p>Order: {order.customerName}</p>
          <p>Status: {order.status}</p>
          <p>ETA: {order.estimatedETA}</p>
        </div>
      ))}
    </div>
  );
}
