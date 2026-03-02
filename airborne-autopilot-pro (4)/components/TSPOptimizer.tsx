import { useState, useRef, useEffect, useCallback } from "react";
import { Route, Plus, Trash2, Play, RotateCcw, TrendingDown, MapPin, AlertCircle, Drone, Save, LogOut, Lock } from "lucide-react";
import io from "socket.io-client";

const API_BASE = "http://localhost:5000/api/v1";
const SOCKET_URL = "http://localhost:5000";

interface Stop {
  id: string;
  name: string;
  x: number;
  y: number;
  type: "DEPOT" | "DELIVERY" | "PICKUP";
  priority: "HIGH" | "MEDIUM" | "LOW";
}

interface RouteResult {
  order: Stop[];
  totalDistance: number;
  savings: number;
  savingsPct: number;
}

interface DroneData {
  _id: string;
  droneId: string;
  name: string;
  status: string;
  battery: number;
  latitude: number;
  longitude: number;
  altitude: number;
}

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
}

const CANVAS_W = 560;
const CANVAS_H = 380;

const PRESET_STOPS: Stop[] = [
  { id: "depot", name: "Main Depot", x: 280, y: 190, type: "DEPOT", priority: "HIGH" },
  { id: "s1", name: "Medical Hub", x: 120, y: 80, type: "DELIVERY", priority: "HIGH" },
  { id: "s2", name: "Residential A", x: 420, y: 100, type: "DELIVERY", priority: "MEDIUM" },
  { id: "s3", name: "Commercial Ctr", x: 460, y: 280, type: "PICKUP", priority: "LOW" },
  { id: "s4", name: "Industrial Zone", x: 100, y: 300, type: "DELIVERY", priority: "MEDIUM" },
  { id: "s5", name: "Office Block", x: 320, y: 320, type: "DELIVERY", priority: "HIGH" },
];

function dist(a: Stop, b: Stop) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function bruteTSP(stops: Stop[]): Stop[] {
  const deliveries = stops.filter(s => s.type !== "DEPOT");
  const depot = stops.find(s => s.type === "DEPOT")!;
  if (!depot || deliveries.length === 0) return stops;
  if (deliveries.length > 8) return nearestNeighbor(stops);

  let best: Stop[] = [];
  let bestDist = Infinity;

  function permute(arr: Stop[], current: Stop[]) {
    if (arr.length === 0) {
      const route = [depot, ...current, depot];
      let d = 0;
      for (let i = 0; i < route.length - 1; i++) d += dist(route[i], route[i + 1]);
      if (d < bestDist) { bestDist = d; best = [...current]; }
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      permute([...arr.slice(0, i), ...arr.slice(i + 1)], [...current, arr[i]]);
    }
  }
  permute(deliveries, []);
  return [depot, ...best, depot];
}

function nearestNeighbor(stops: Stop[]): Stop[] {
  const depot = stops.find(s => s.type === "DEPOT")!;
  const deliveries = stops.filter(s => s.type !== "DEPOT");
  if (!depot) return stops;
  const visited = new Set<string>();
  const route: Stop[] = [depot];
  let current = depot;
  while (visited.size < deliveries.length) {
    let nearest: Stop | null = null;
    let nearestDist = Infinity;
    for (const s of deliveries) {
      if (!visited.has(s.id)) {
        const d = dist(current, s);
        if (d < nearestDist) { nearestDist = d; nearest = s; }
      }
    }
    if (nearest) { visited.add(nearest.id); route.push(nearest); current = nearest; }
  }
  route.push(depot);
  return route;
}

function naiveRoute(stops: Stop[]): Stop[] {
  const depot = stops.find(s => s.type === "DEPOT")!;
  const deliveries = stops.filter(s => s.type !== "DEPOT");
  return [depot, ...deliveries, depot];
}

function routeDistance(route: Stop[]): number {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) d += dist(route[i], route[i + 1]);
  return d;
}

export default function TSPOptimizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<any>(null);
  const [stops, setStops] = useState<Stop[]>(PRESET_STOPS);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useBackend, setUseBackend] = useState(true);
  const animRef = useRef<number>(0);
  const [drones, setDrones] = useState<DroneData[]>([]);
  const [selectedDrone, setSelectedDrone] = useState<string>("");
  const [showAuthDialog, setShowAuthDialog] = useState(!token);
  const [authEmail, setAuthEmail] = useState("admin@charronix.com");
  const [authPassword, setAuthPassword] = useState("Admin@123");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token && !socketRef.current) {
      const socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => {
        socket.emit("subscribe", { channel: "fleet:update" });
        socket.emit("subscribe", { channel: "drone:telemetry" });
      });

      socket.on("drone:telemetry", (data: DroneData) => {
        setDrones(prev => {
          const idx = prev.findIndex(d => d._id === data._id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data;
            return updated;
          }
          return [...prev, data];
        });
      });

      socket.on("fleet:update", (data: { drones: DroneData[] }) => {
        setDrones(data.drones);
      });

      socket.on("error", (err: string) => setError(err));
      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current && !token) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  // Fetch drones on mount
  useEffect(() => {
    if (token) fetchDrones();
  }, [token]);

  async function fetchDrones() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/drones/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDrones(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedDrone(data.data[0]._id);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch drones", err);
    }
  }

  async function handleLogin() {
    setLoadingAuth(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      const newToken = data.data.token;
      setToken(newToken);
      setUser(data.data.user);
      localStorage.setItem("token", newToken);
      setShowAuthDialog(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoadingAuth(false);
    }
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setDrones([]);
    setSelectedDrone("");
    localStorage.removeItem("token");
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setShowAuthDialog(true);
  }

  async function saveRouteAsOrder() {
    if (!result || !token || !selectedDrone) {
      setError("Need result, auth, and drone selection");
      return;
    }

    setSavingOrder(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: `ORD-${Date.now()}`,
          destination: result.order.find(s => s.type !== "DEPOT") || result.order[0],
          priority: result.order.some(s => s.priority === "HIGH") ? "HIGH" : "MEDIUM",
          droneId: selectedDrone,
          waypoints: result.order
            .filter(s => s.type !== "DEPOT")
            .map(s => ({ latitude: s.y / 2, longitude: s.x / 2 })),
          estimatedDistance: result.totalDistance,
          estimatedTime: Math.ceil(result.totalDistance / 30),
        }),
      });
      if (!res.ok) throw new Error(`Order creation failed: ${res.status}`);
      const data = await res.json();
      setError(null);
      alert(`Order created: ${data.data.orderId}`);
    } catch (err: any) {
      setError(err.message || "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    const unoptRoute = naiveRoute(stops);

    if (result) {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(100,116,139,0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      unoptRoute.forEach((s, i) => (i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y)));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (result) {
      const displayRoute = result.order.slice(0, Math.max(2, animStep + 1));
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "#0ea5e9";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      displayRoute.forEach((s, i) => (i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y)));
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (let i = 0; i < displayRoute.length - 1; i++) {
        const a = displayRoute[i],
          b = displayRoute[i + 1];
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2;
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        ctx.fillStyle = "#0ea5e9";
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(-4, 5);
        ctx.lineTo(-4, -5);
        ctx.fill();
        ctx.restore();
      }
    }

    stops.forEach(stop => {
      const isDepot = stop.type === "DEPOT";
      const isInRoute = result?.order.slice(0, animStep + 1).some(s => s.id === stop.id);

      const color =
        isDepot ? "#f59e0b" : stop.priority === "HIGH" ? "#ef4444" : stop.priority === "MEDIUM" ? "#0ea5e9" : "#10b981";
      const r = isDepot ? 14 : 10;

      if (isInRoute || isDepot) {
        ctx.beginPath();
        ctx.arc(stop.x, stop.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + "22";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(stop.x, stop.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color + (isInRoute ? "ff" : "88");
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `${isDepot ? "bold " : ""}11px monospace`;
      ctx.fillStyle = isInRoute ? "white" : "rgba(255,255,255,0.6)";
      ctx.textAlign = "center";
      ctx.fillText(stop.name, stop.x, stop.y - r - 6);

      if (result && isInRoute && !isDepot) {
        const idx = result.order.findIndex(s => s.id === stop.id);
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "white";
        ctx.fillText(String(idx), stop.x, stop.y + 3.5);
      }
    });
  }, [stops, result, animStep]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  function optimizeRoute() {
    setRunning(true);
    setResult(null);
    setAnimStep(0);
    setError(null);

    if (useBackend && token) {
      const stopIds = stops.filter(s => s.type !== "DEPOT").map((s, i) => i);

      fetch(`${API_BASE}/pathfinder/tsp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stops: stopIds, algorithm: "auto" }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (data.success && data.data) {
            const backendOrder = data.data.tour;
            const backendDist = data.data.totalDistance;
            const naive = naiveRoute(stops);
            const naiveDist = routeDistance(naive);
            const savings = naiveDist - backendDist;
            const savingsPct = naiveDist > 0 ? (savings / naiveDist) * 100 : 0;

            const orderedStops = backendOrder.map((idx: number) => stops[idx]);
            setResult({ order: orderedStops, totalDistance: backendDist, savings, savingsPct });
            animateRoute(orderedStops);
          }
        })
        .catch(err => {
          console.warn("Backend failed, using local algorithm:", err);
          useLocalOptimization();
        })
        .finally(() => setRunning(false));
    } else {
      useLocalOptimization();
    }
  }

  function useLocalOptimization() {
    setTimeout(() => {
      const optimized = stops.length <= 9 ? bruteTSP(stops) : nearestNeighbor(stops);
      const naive = naiveRoute(stops);
      const optDist = routeDistance(optimized);
      const naiveDist = routeDistance(naive);
      const savings = naiveDist - optDist;
      const savingsPct = naiveDist > 0 ? (savings / naiveDist) * 100 : 0;

      setResult({ order: optimized, totalDistance: optDist, savings, savingsPct });
      setRunning(false);
      animateRoute(optimized);
    }, 600);
  }

  function animateRoute(route: Stop[]) {
    let step = 0;
    const animate = () => {
      step++;
      setAnimStep(step);
      if (step < route.length - 1) {
        animRef.current = window.setTimeout(animate, 180);
      }
    };
    animRef.current = window.setTimeout(animate, 100);
  }

  function addStop(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!addMode) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = `s${Date.now()}`;
    setStops(prev => [...prev, { id, name: `Stop ${prev.length}`, x, y, type: "DELIVERY", priority: "MEDIUM" }]);
    setResult(null);
  }

  function startDrag(e: React.MouseEvent<HTMLCanvasElement>) {
    if (addMode) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    const hit = stops.find(s => dist(s, { ...s, x: mx, y: my }) < 16);
    if (hit) setDragging(hit.id);
  }

  function onDrag(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    setStops(prev =>
      prev.map(s => (s.id === dragging ? { ...s, x: e.clientX - rect.left, y: e.clientY - rect.top } : s))
    );
    setResult(null);
  }

  function reset() {
    clearTimeout(animRef.current);
    setStops(PRESET_STOPS);
    setResult(null);
    setAnimStep(0);
    setRunning(false);
  }

  // Auth Dialog
  if (showAuthDialog && !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Login</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="admin@charronix.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={handleLogin}
              disabled={loadingAuth}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {loadingAuth ? "Logging in..." : "Login"}
            </button>
            <p className="text-xs text-slate-500 text-center mt-4">Demo: admin@charronix.com / Admin@123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="mb-5 flex items-center gap-3">
        <div className="p-2 bg-sky-500/20 rounded-lg">
          <Route className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">TSP Route Optimizer</h1>
          <p className="text-sm text-slate-400">{user?.email ? `Logged in as ${user.email}` : "Connecting..."}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setUseBackend(!useBackend)}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              useBackend ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
            }`}
            title="Use backend API vs local algorithm"
          >
            {useBackend ? "Backend" : "Local"}
          </button>
          <button
            onClick={() => setAddMode(!addMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              addMode ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Plus className="w-4 h-4" /> {addMode ? "Click map to add" : "Add Stop"}
          </button>
          <button onClick={reset} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-2">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className={`rounded-lg ${addMode ? "cursor-crosshair" : "cursor-grab"}`}
              style={{ background: "rgb(2,6,23)" }}
              onClick={addStop}
              onMouseDown={startDrag}
              onMouseMove={onDrag}
              onMouseUp={() => setDragging(null)}
              onMouseLeave={() => setDragging(null)}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Depot
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> High Priority
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Low
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <span className="w-4 border-t border-dashed border-slate-500 inline-block" /> Unoptimized
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 border-t-2 border-sky-400 inline-block" /> Optimized
            </span>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          {/* Drone Selection */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Assign Drone ({drones.length})
            </label>
            <select
              value={selectedDrone}
              onChange={e => setSelectedDrone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a drone...</option>
              {drones.map(drone => (
                <option key={drone._id} value={drone._id}>
                  {drone.name} ({drone.status}) - {drone.battery}%
                </option>
              ))}
            </select>
            {selectedDrone && <div className="mt-2 text-xs text-slate-400">✓ Drone assigned and ready</div>}
          </div>

          <button
            onClick={optimizeRoute}
            disabled={running || stops.length < 3}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Optimizer
              </>
            )}
          </button>

          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-emerald-300 text-sm">Optimization Results</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Optimized dist.</span>
                <span className="text-white font-mono">{result.totalDistance.toFixed(0)} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Distance saved</span>
                <span className="text-emerald-400 font-mono">-{result.savings.toFixed(0)} units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Efficiency gain</span>
                <span className="text-emerald-400 font-bold">{result.savingsPct.toFixed(1)}% better</span>
              </div>
              <button
                onClick={saveRouteAsOrder}
                disabled={savingOrder || !selectedDrone}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-3"
              >
                {savingOrder ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save as Order
                  </>
                )}
              </button>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Delivery Stops ({stops.filter(s => s.type !== "DEPOT").length})
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stops
                .filter(s => s.type !== "DEPOT")
                .map((stop, i) => (
                  <div key={stop.id} className="flex items-center gap-2 text-sm group hover:bg-slate-800/50 p-1 rounded transition-colors">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        stop.priority === "HIGH" ? "bg-red-400" : stop.priority === "MEDIUM" ? "bg-sky-400" : "bg-emerald-400"
                      }`}
                    />
                    <Drone className="w-3 h-3 flex-shrink-0 text-slate-500" />
                    <span className="text-slate-300 flex-1 truncate">{stop.name}</span>
                    {result && <span className="text-xs text-purple-400 font-mono">#{result.order.findIndex(s => s.id === stop.id)}</span>}
                    <button
                      onClick={() => {
                        setStops(prev => prev.filter(s => s.id !== stop.id));
                        setResult(null);
                      }}
                      className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {result && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Optimal Visit Order</p>
              <div className="space-y-1">
                {result.order
                  .filter(s => s.type !== "DEPOT")
                  .map((stop, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="text-purple-400 font-bold w-4">{i + 1}.</span>
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{stop.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
