import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Wrench, AlertTriangle, TrendingUp, Calendar, Zap, Settings } from "lucide-react";

interface Drone {
  id: string;
  name: string;
  battery: number;
  status: string;
  position: { x: number; y: number; z: number };
}

interface MaintenanceMetric {
  droneId: string;
  droneName: string;
  cycleCount: number;
  flightHours: number;
  errorRate: number;
  motorHealth: number; // 0-100
  batteryHealth: number; // 0-100
  estimatedFailureDate: Date;
  maintenancePriority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#a855f7"];

export default function PredictiveMaintenance({ drones }: { drones: Drone[] }) {
  const [selectedDrone, setSelectedDrone] = useState<string>(drones[0]?.id || "");
  const [maintenanceData] = useState<MaintenanceMetric[]>(
    drones.map((d, i) => ({
      droneId: d.id,
      droneName: d.name,
      cycleCount: Math.floor(Math.random() * 1000) + 500,
      flightHours: Math.floor(Math.random() * 500) + 100,
      errorRate: Math.random() * 5,
      motorHealth: Math.floor(Math.random() * 40) + 60,
      batteryHealth: Math.floor(Math.random() * 30) + 70,
      estimatedFailureDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      maintenancePriority: ["CRITICAL", "HIGH", "MEDIUM", "LOW"][Math.floor(Math.random() * 4)] as any
    }))
  );

  const selected = maintenanceData.find(m => m.droneId === selectedDrone);

  // Generate health trends
  const healthTrend = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    motor: Math.max(0, selected?.motorHealth || 0) + (Math.random() - 0.5) * 5,
    battery: Math.max(0, selected?.batteryHealth || 0) + (Math.random() - 0.5) * 3
  }));

  // Component usage data
  const componentData = [
    { name: "Motors", hours: 250, status: "OPERATIONAL" },
    { name: "Battery", hours: 180, status: "GOOD" },
    { name: "ESC", hours: 300, status: "OPTIMAL" },
    { name: "Camera", hours: 120, status: "FAIR" }
  ];

  // Error prediction
  const errorPrediction = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    predicted: Math.floor(Math.random() * 50) + 20,
    actual: i < new Date().getMonth() ? Math.floor(Math.random() * 40) + 15 : 0
  }));

  // Maintenance schedule
  const maintenanceSchedule = [
    { component: "Oil Change", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "URGENT", interval: "Every 50 hours" },
    { component: "Battery Calibration", dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), status: "PENDING", interval: "Every 100 hours" },
    { component: "Motor Check", dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), status: "SCHEDULED", interval: "Every 200 hours" },
    { component: "Full Inspection", dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "SCHEDULED", interval: "Every 500 hours" }
  ];

  const getPriorityColor = (priority: string) =>
    priority === "CRITICAL" ? "text-red-400 bg-red-500/10" :
    priority === "HIGH" ? "text-amber-400 bg-amber-500/10" :
    priority === "MEDIUM" ? "text-sky-400 bg-sky-500/10" :
    "text-emerald-400 bg-emerald-500/10";

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Wrench className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Predictive Maintenance</h1>
            <p className="text-sm text-slate-400">ML-powered drone health prediction & maintenance scheduling</p>
          </div>
        </div>
      </div>

      {/* Drone Selector */}
      <div className="grid grid-cols-4 gap-3 mb-6 overflow-x-auto">
        {maintenanceData.map(m => (
          <button
            key={m.droneId}
            onClick={() => setSelectedDrone(m.droneId)}
            className={`flex-shrink-0 p-4 rounded-lg border transition-all ${
              selectedDrone === m.droneId
                ? "bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "bg-slate-900 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <div className="text-xs font-bold uppercase text-slate-400 mb-1">{m.droneName}</div>
            <div className={`text-lg font-bold ${getPriorityColor(m.maintenancePriority).split(" ")[0]}`}>
              {m.maintenancePriority}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Motor Health",
                value: `${selected.motorHealth.toFixed(0)}%`,
                icon: Settings,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10"
              },
              {
                label: "Battery Health",
                value: `${selected.batteryHealth.toFixed(1)}%`,
                icon: Zap,
                color: "text-blue-400",
                bg: "bg-blue-500/10"
              },
              {
                label: "Flight Hours",
                value: `${selected.flightHours}h`,
                icon: TrendingUp,
                color: "text-purple-400",
                bg: "bg-purple-500/10"
              },
              {
                label: "Est. Failure",
                value: selected.estimatedFailureDate.toLocaleDateString(),
                icon: Calendar,
                color: selected.maintenancePriority === "CRITICAL" ? "text-red-400" : "text-amber-400",
                bg: selected.maintenancePriority === "CRITICAL" ? "bg-red-500/10" : "bg-amber-500/10"
              }
            ].map((kpi, i) => (
              <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            {/* Health Trend */}
            <div className="col-span-6 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Health Trend (7 days)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={healthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="motor" stroke="#10b981" strokeWidth={2} name="Motor" />
                  <Line type="monotone" dataKey="battery" stroke="#0ea5e9" strokeWidth={2} name="Battery" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Component Status */}
            <div className="col-span-6 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                Component Status
              </h3>
              <div className="space-y-3">
                {componentData.map((comp, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{comp.name}</span>
                      <span className={
                        comp.status === "OPERATIONAL" ? "text-emerald-400" :
                        comp.status === "GOOD" ? "text-sky-400" :
                        comp.status === "OPTIMAL" ? "text-purple-400" : "text-amber-400"
                      }>{comp.status}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-500 to-purple-500 rounded-full" style={{ width: `${(comp.hours / 350) * 100}%` }} />
                    </div>
                    <div className="text-xs text-slate-500">{comp.hours} operating hours</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Error Prediction */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            <div className="col-span-8 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4">Error Prediction (12-month)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={errorPrediction}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                  <Bar dataKey="predicted" fill="#f59e0b" name="Predicted" />
                  <Bar dataKey="actual" fill="#0ea5e9" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Failure Probability */}
            <div className="col-span-4 bg-slate-900 border border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-4">Failure Probability</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Healthy", value: Math.max(0, 100 - selected.errorRate * 10) },
                      { name: "Risk", value: Math.min(100, selected.errorRate * 10) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Healthy:</span>
                  <span className="text-emerald-400 font-bold">{(100 - selected.errorRate * 10).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">At Risk:</span>
                  <span className="text-red-400 font-bold">{(selected.errorRate * 10).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Maintenance Schedule
            </h3>
            <div className="space-y-3">
              {maintenanceSchedule.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {item.status === "URGENT" && <AlertTriangle className="w-4 h-4 text-red-400" />}
                      <span>{item.component}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{item.interval}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                      item.status === "URGENT" ? "text-red-400 bg-red-500/10" :
                      item.status === "PENDING" ? "text-amber-400 bg-amber-500/10" :
                      "text-emerald-400 bg-emerald-500/10"
                    }`}>
                      {item.status}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{item.dueDate.toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
