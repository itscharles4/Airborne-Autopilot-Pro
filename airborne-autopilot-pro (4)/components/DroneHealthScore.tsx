import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Battery, Clock, Cpu, TrendingDown, TrendingUp, Zap } from "lucide-react";

interface Drone {
  id: string;
  name: string;
  model: string;
  status: string;
  battery: number;
  speed: number;
  lastUpdated: string;
}

interface HealthMetrics {
  batteryScore: number;
  flightHours: number;
  maintenanceDue: number;
  errorCount: number;
  speedVariance: number;
  overallScore: number;
  trend: "up" | "down" | "stable";
  grade: "A" | "B" | "C" | "D" | "F";
  recommendations: string[];
}

interface Props {
  drones: Drone[];
}

function computeHealth(drone: Drone): HealthMetrics {
  // Simulate deterministic but varied metrics based on drone id
  const seed = drone.id.charCodeAt(drone.id.length - 1);
  const flightHours = ((seed * 13) % 120) + 5;
  const errorCount = ((seed * 7) % 8);
  const speedVariance = ((seed * 3) % 30);

  const batteryScore = drone.battery >= 80 ? 100 : drone.battery >= 50 ? 75 : drone.battery >= 20 ? 40 : 15;
  const maintenanceDue = Math.max(0, 100 - flightHours);
  const maintenanceScore = maintenanceDue > 50 ? 100 : maintenanceDue > 20 ? 65 : maintenanceDue > 5 ? 30 : 10;
  const errorScore = Math.max(0, 100 - errorCount * 12);
  const varianceScore = speedVariance < 10 ? 100 : speedVariance < 20 ? 70 : 40;

  const overallScore = Math.round(
    (batteryScore * 0.35) + (maintenanceScore * 0.30) + (errorScore * 0.20) + (varianceScore * 0.15)
  );

  const grade: HealthMetrics["grade"] =
    overallScore >= 90 ? "A" :
    overallScore >= 75 ? "B" :
    overallScore >= 60 ? "C" :
    overallScore >= 40 ? "D" : "F";

  const trend: HealthMetrics["trend"] =
    drone.status === "EMERGENCY" ? "down" :
    drone.battery > 70 ? "up" : "stable";

  const recommendations: string[] = [];
  if (batteryScore < 50) recommendations.push("Schedule immediate charging cycle");
  if (maintenanceDue < 20) recommendations.push(`Maintenance overdue — ${flightHours}h logged`);
  if (errorCount > 5) recommendations.push("High error rate — run diagnostics");
  if (speedVariance > 20) recommendations.push("Erratic flight pattern detected");
  if (recommendations.length === 0) recommendations.push("All systems nominal");

  return { batteryScore, flightHours, maintenanceDue, errorCount, speedVariance, overallScore, trend, grade, recommendations };
}

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const offset = circumference * 0.25;
  const dashOffset = arcLength - (score / 100) * arcLength;

  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1e293b" strokeWidth={size * 0.1}
        strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={-offset}
        strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth={size * 0.1}
        strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={dashOffset + arcLength - arcLength}
        strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`}
        style={{ strokeDashoffset: -offset + dashOffset, transition: "stroke-dashoffset 0.8s ease" }} />
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={size * 0.22} fontWeight="bold">{score}</text>
    </svg>
  );
}

function MetricBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-white">{value}{max === 100 ? "%" : "h"}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function DroneHealthScore({ drones }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (drones.length > 0 && !selected) setSelected(drones[0].id);
  }, [drones]);

  const selectedDrone = drones.find(d => d.id === selected);
  const selectedHealth = selectedDrone ? computeHealth(selectedDrone) : null;

  const fleetAvg = Math.round(drones.reduce((s, d) => s + computeHealth(d).overallScore, 0) / (drones.length || 1));

  const handleSelect = (id: string) => {
    setAnimating(true);
    setTimeout(() => { setSelected(id); setAnimating(false); }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-emerald-500/20 rounded-lg"><Activity className="w-6 h-6 text-emerald-400" /></div>
        <div>
          <h1 className="text-xl font-bold text-white">Drone Health Scoring</h1>
          <p className="text-sm text-slate-400">Composite health analysis across fleet</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span className="text-sm text-slate-300">Fleet Avg:</span>
          <span className={`font-bold text-sm ${fleetAvg >= 75 ? "text-emerald-400" : fleetAvg >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {fleetAvg}/100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Drone List */}
        <div className="col-span-4 space-y-2">
          {drones.map(drone => {
            const h = computeHealth(drone);
            const isSelected = selected === drone.id;
            return (
              <div key={drone.id} onClick={() => handleSelect(drone.id)}
                className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 ${isSelected
                  ? "bg-slate-800 border-sky-500 shadow-lg shadow-sky-500/10"
                  : "bg-slate-900 border-slate-700 hover:border-slate-500"}`}>
                <div className="flex items-center gap-3">
                  <ScoreGauge score={h.overallScore} size={56} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{drone.name}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${h.grade === "A" ? "bg-emerald-500/20 text-emerald-400" : h.grade === "B" ? "bg-sky-500/20 text-sky-400" : h.grade === "C" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                        {h.grade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{drone.model}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {h.trend === "up" ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : h.trend === "down" ? <TrendingDown className="w-3 h-3 text-red-400" /> : <Activity className="w-3 h-3 text-amber-400" />}
                      <span className="text-xs text-slate-400">{drone.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="col-span-8">
          {selectedDrone && selectedHealth && (
            <div className={`transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}>
              {/* Score Header */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-4">
                <div className="flex items-center gap-6">
                  <ScoreGauge score={selectedHealth.overallScore} size={100} />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedDrone.name}</h2>
                    <p className="text-slate-400 text-sm">{selectedDrone.model}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-4xl font-black ${selectedHealth.grade === "A" ? "text-emerald-400" : selectedHealth.grade === "B" ? "text-sky-400" : selectedHealth.grade === "C" ? "text-amber-400" : "text-red-400"}`}>
                        Grade {selectedHealth.grade}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto grid grid-cols-2 gap-3">
                    {[
                      { icon: Battery, label: "Battery", value: `${selectedDrone.battery.toFixed(0)}%`, color: "text-sky-400" },
                      { icon: Clock, label: "Flight Hours", value: `${selectedHealth.flightHours}h`, color: "text-purple-400" },
                      { icon: AlertTriangle, label: "Errors", value: selectedHealth.errorCount, color: "text-amber-400" },
                      { icon: Zap, label: "Speed Var.", value: `${selectedHealth.speedVariance}%`, color: "text-emerald-400" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="bg-slate-800 rounded-lg p-3 text-center">
                        <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                        <div className="text-white font-bold text-sm">{value}</div>
                        <div className="text-slate-400 text-xs">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Score Breakdown</h3>
                  <MetricBar label="Battery Health" value={selectedHealth.batteryScore} color="#0ea5e9" />
                  <MetricBar label="Maintenance Index" value={Math.round((selectedHealth.maintenanceDue / 100) * 100)} color="#a855f7" />
                  <MetricBar label="Error Rate Score" value={Math.max(0, 100 - selectedHealth.errorCount * 12)} color="#10b981" />
                  <MetricBar label="Flight Stability" value={Math.max(0, 100 - selectedHealth.speedVariance)} color="#f59e0b" />
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">AI Recommendations</h3>
                  <div className="space-y-2">
                    {selectedHealth.recommendations.map((rec, i) => (
                      <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-sm ${rec.includes("nominal") ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                        <span className="mt-0.5">{rec.includes("nominal") ? "✅" : "⚠️"}</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Maintenance Timeline */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Maintenance Timeline</h3>
                <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(selectedHealth.flightHours / 100) * 100}%`,
                      background: selectedHealth.flightHours > 90 ? "#ef4444" : selectedHealth.flightHours > 70 ? "#f59e0b" : "#10b981"
                    }} />
                  <div className="absolute right-0 top-0 h-full w-0.5 bg-red-400" />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0h</span>
                  <span className="text-amber-400">⚠ 70h</span>
                  <span className="text-red-400">🔴 100h (due)</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {selectedHealth.flightHours}h logged — {Math.max(0, 100 - selectedHealth.flightHours)}h remaining before scheduled maintenance
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
