import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Download, Clock, AlertCircle, Volume2 } from "lucide-react";

interface Drone {
  id: string;
  name: string;
  battery: number;
  position: { x: number; y: number; z: number };
}

interface Telemetry {
  tick: number;
  timestamp: string;
  drones: Array<{
    id: string;
    x: number;
    y: number;
    z: number;
    battery: number;
    speed: number;
  }>;
}

interface FlightEvent {
  tick: number;
  type: "TAKEOFF" | "REROUTE" | "COLLISION_WARNING" | "LOW_BATTERY" | "LANDING";
  droneId: string;
  message: string;
  severity: "info" | "warning" | "critical";
}

interface Props {
  drones: Drone[];
}

function generateTelemetry(drones: Drone[]): { telemetries: Telemetry[]; events: FlightEvent[] } {
  const telemetries: Telemetry[] = [];
  const events: FlightEvent[] = [];
  const dronePathPhase = new Map(drones.map(d => [d.id, Math.random() * Math.PI * 2]));

  for (let tick = 0; tick < 120; tick++) {
    const teleData = drones.map(d => {
      const phase = dronePathPhase.get(d.id)!;
      const offset = (tick / 120) * Math.PI * 4;
      const x = Math.sin(offset + phase) * 150 + 200;
      const y = Math.cos(offset + phase * 0.7) * 100 + 150;
      const z = Math.max(0, Math.min(300, 150 + Math.sin(offset * 1.3) * 80));
      const battery = Math.max(0, d.battery - (tick * 0.05));
      const speed = Math.abs(Math.cos(offset + phase) * 60);

      return {
        id: d.id,
        x: Math.round(x),
        y: Math.round(y),
        z: Math.round(z),
        battery: Math.max(0, battery),
        speed: Math.round(speed)
      };
    });

    telemetries.push({
      tick,
      timestamp: new Date(Date.now() + tick * 1000).toISOString(),
      drones: teleData
    });

    // Event injection
    if (tick === 10) {
      drones.forEach(d => {
        events.push({ tick, type: "TAKEOFF", droneId: d.id, message: `${d.name} takeoff initiated`, severity: "info" });
      });
    }
    if (tick === 30) {
      events.push({ tick, type: "REROUTE", droneId: drones[0].id, message: "Rerouting due to airspace conflict", severity: "warning" });
    }
    if (tick === 60) {
      events.push({ tick, type: "COLLISION_WARNING", droneId: drones[1].id, message: "Collision warning: proximity alert", severity: "critical" });
    }
    
    teleData.forEach(td => {
      if (td.battery < 20 && td.battery > 19) {
        events.push({ tick, type: "LOW_BATTERY", droneId: td.id, message: `${td.id}: Battery critically low`, severity: "critical" });
      }
    });
  }

  return { telemetries, events };
}

export default function FlightReplay({ drones }: Props) {
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [telemetries, setTelemetries] = useState<Telemetry[]>([]);
  const [events, setEvents] = useState<FlightEvent[]>([]);
  const playbackRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const { telemetries: t, events: e } = generateTelemetry(drones);
    setTelemetries(t);
    setEvents(e);
  }, [drones]);

  useEffect(() => {
    if (!isPlaying || telemetries.length === 0) return;

    const interval = 100 / speed;
    playbackRef.current = setInterval(() => {
      setCurrentTick(prev => {
        if (prev >= telemetries.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(playbackRef.current);
  }, [isPlaying, speed, telemetries.length]);

  const currentTelemetry = telemetries[currentTick];
  const currentEvents = events.filter(e => Math.abs(e.tick - currentTick) < 5);

  const exportCSV = () => {
    if (telemetries.length === 0) return;

    let csv = "Tick,Timestamp,DroneID,X,Y,Z,Battery,Speed\n";
    telemetries.forEach(t => {
      t.drones.forEach(d => {
        csv += `${t.tick},"${t.timestamp}",${d.id},${d.x},${d.y},${d.z},${d.battery.toFixed(2)},${d.speed}\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flight_log.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const severityColor = (s: string) =>
    s === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" :
    s === "warning" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-cyan-500/20 rounded-lg"><Clock className="w-6 h-6 text-cyan-400" /></div>
        <div>
          <h1 className="text-xl font-bold">Flight Replay & Audit Trail</h1>
          <p className="text-sm text-slate-400">Telemetry playback with event logging</p>
        </div>
        <div className="ml-auto text-sm text-slate-400">
          Tick {currentTick + 1} / {telemetries.length}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Canvas */}
        <div className="col-span-8">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
            {/* 3D View */}
            <div className="bg-black/40 rounded-lg p-8 h-80 flex flex-col items-center justify-center border border-slate-800">
              {currentTelemetry ? (
                <div className="text-center space-y-4">
                  <div className="text-3xl font-mono font-bold text-cyan-400">
                    T:{currentTick.toString().padStart(3, "0")}
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    {currentTelemetry.drones.map(d => (
                      <div key={d.id} className="flex justify-between gap-8">
                        <span className="text-slate-400">{d.id}</span>
                        <span className="font-mono">
                          pos:[{d.x},{d.y},{d.z}] bat:{d.battery.toFixed(1)}% spd:{d.speed}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No telemetry data</p>
              )}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2 bg-slate-800 p-4 rounded-lg">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => { setCurrentTick(0); setIsPlaying(false); }}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0"
                max={Math.max(0, telemetries.length - 1)}
                value={currentTick}
                onChange={e => { setCurrentTick(parseInt(e.target.value)); setIsPlaying(false); }}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />

              <button
                onClick={() => setCurrentTick(Math.max(0, telemetries.length - 1))}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Speed Control */}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-600">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <select
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                </select>
              </div>

              <button
                onClick={exportCSV}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
            </div>

            {/* Event Markers on Timeline */}
            <div className="relative h-8 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              {events.map((e, i) => (
                <div
                  key={i}
                  className={`absolute w-1 h-full ${
                    e.severity === "critical"
                      ? "bg-red-500"
                      : e.severity === "warning"
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                  }`}
                  style={{
                    left: `${(e.tick / (telemetries.length - 1)) * 100}%`,
                  }}
                  title={e.message}
                />
              ))}
              <div
                className="absolute w-0.5 h-full bg-white/50"
                style={{
                  left: `${(currentTick / (telemetries.length - 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              Recent Events (±5 ticks)
            </h3>

            {currentEvents.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentEvents.map((e, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${severityColor(e.severity)} text-xs cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => setCurrentTick(e.tick)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold">{e.type}</div>
                        <div className="text-[10px] opacity-75">{e.message}</div>
                      </div>
                      <span className="text-[10px] opacity-60">T{e.tick}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No events in current window</p>
            )}
          </div>

          {/* All Events List */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Flight Log</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto text-xs">
              {events.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                  onClick={() => { setCurrentTick(e.tick); setIsPlaying(false); }}
                >
                  <span className="text-slate-500 flex-shrink-0">T{e.tick}</span>
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      e.severity === "critical"
                        ? "bg-red-400"
                        : e.severity === "warning"
                        ? "bg-amber-400"
                        : "bg-cyan-400"
                    }`}
                  />
                  <span className="text-slate-300 truncate">{e.type}</span>
                  <span className="text-slate-500 ml-auto flex-shrink-0">{e.droneId}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Recorded Duration</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Ticks:</span>
                <span className="text-white font-mono">{telemetries.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white font-mono">{telemetries.length}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Events:</span>
                <span className="text-white font-mono">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Critical:</span>
                <span className="text-red-400 font-mono">
                  {events.filter(e => e.severity === "critical").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
