import { useState } from "react";
import { BarChart as BarChartIcon, TrendingUp, TrendingDown, Download, DollarSign, Package, Zap } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Drone {
  id: string;
  name: string;
  battery: number;
  status: string;
}

interface Props {
  drones: Drone[];
}

// Mock data generators
const generateRevenueData = () => [
  { day: "Mon", revenue: 2400, cost: 1200, profit: 1200 },
  { day: "Tue", revenue: 2210, cost: 1221, profit: 989 },
  { day: "Wed", revenue: 2290, cost: 1229, profit: 1061 },
  { day: "Thu", revenue: 2000, cost: 1200, profit: 800 },
  { day: "Fri", revenue: 2181, cost: 1200, profit: 981 },
  { day: "Sat", revenue: 2500, cost: 1300, profit: 1200 },
  { day: "Sun", revenue: 2100, cost: 1100, profit: 1000 },
];

const generateDroneRevenue = (drones: Drone[]) =>
  drones.map(d => ({
    id: d.name,
    revenue: Math.random() * 800 + 300,
    deliveries: Math.floor(Math.random() * 30 + 10),
    efficiency: Math.random() * 30 + 70,
  }));

const generateCostBreakdown = () => [
  { name: "Maintenance", value: 2400 },
  { name: "Energy", value: 1200 },
  { name: "Operations", value: 800 },
  { name: "Monitoring", value: 400 },
];

const generateCostTrend = () => [
  { week: "W1", cost: 2400, profit: 2100 },
  { week: "W2", cost: 1398, profit: 2210 },
  { week: "W3", cost: 9800, profit: 2290 },
  { week: "W4", cost: 3908, profit: 2000 },
];

export default function RevenueDashboard({ drones }: Props) {
  const [tab, setTab] = useState<"overview" | "drones" | "costs">("overview");
  const revenueData = generateRevenueData();
  const droneRevenue = generateDroneRevenue(drones);
  const costBreakdown = generateCostBreakdown();
  const costTrend = generateCostTrend();

  const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

  const totalWeeklyRevenue = 15381;
  const prevWeekRevenue = 14500;
  const woWChange = totalWeeklyRevenue - prevWeekRevenue;
  const woWPct = ((woWChange / prevWeekRevenue) * 100).toFixed(1);

  const totalProfit = 6031;
  const totalRevenue = 15381;
  const marginPct = ((totalProfit / totalRevenue) * 100).toFixed(1);

  const totalDeliveries = droneRevenue.reduce((s, d) => s + d.deliveries, 0);
  const prevDeliveries = totalDeliveries - 15;
  const deliveryChange = totalDeliveries - prevDeliveries;

  const totalCosts = costBreakdown.reduce((s, c) => s + c.value, 0);
  const prevCosts = totalCosts - 200;
  const costTrend_ = totalCosts > prevCosts ? "up" : "down";

  const exportCSV = () => {
    let csv = "Date,Revenue,Cost,Profit,Margin%\n";
    revenueData.forEach(d => {
      const margin = ((d.profit / d.revenue) * 100).toFixed(1);
      csv += `${d.day},${d.revenue},${d.cost},${d.profit},${margin}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revenue_report.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Revenue & Analytics</h1>
            <p className="text-sm text-slate-400">Financial performance and operational metrics</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold text-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Weekly Revenue",
            value: `$${totalWeeklyRevenue.toLocaleString()}`,
            delta: `${woWChange > 0 ? "+" : ""}$${woWChange}`,
            deltaPct: woWPct,
            icon: DollarSign,
            trend: woWChange > 0 ? "up" : "down",
            color: "text-emerald-400"
          },
          {
            label: "Net Profit",
            value: `$${totalProfit.toLocaleString()}`,
            delta: `${marginPct}%`,
            deltaPct: marginPct,
            icon: TrendingUp,
            trend: "up",
            color: "text-sky-400"
          },
          {
            label: "Total Deliveries",
            value: totalDeliveries,
            delta: `+${deliveryChange}`,
            deltaPct: ((deliveryChange / prevDeliveries) * 100).toFixed(1),
            icon: Package,
            trend: "up",
            color: "text-purple-400"
          },
          {
            label: "Operational Costs",
            value: `$${totalCosts.toLocaleString()}`,
            delta: `${costTrend_ === "up" ? "+" : "-"}$${Math.abs(totalCosts - prevCosts)}`,
            deltaPct: ((Math.abs(totalCosts - prevCosts) / prevCosts) * 100).toFixed(1),
            icon: Zap,
            trend: costTrend_,
            color: "text-amber-400"
          }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-bold text-white mb-2">{kpi.value}</div>
            <div className="flex items-center gap-1">
              {kpi.trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs font-semibold ${kpi.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                {kpi.delta} ({kpi.deltaPct}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-800">
        {[
          { id: "overview", label: "Overview" },
          { id: "drones", label: "Drone Performance" },
          { id: "costs", label: "Cost Analysis" }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 font-semibold text-sm transition-colors border-b-2 ${
              tab === t.id
                ? "text-emerald-400 border-emerald-400"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-400" />
                Revenue vs Cost Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="cost" stroke="#ef4444" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChartIcon className="w-5 h-5 text-emerald-400" />
                Daily Profit
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                    <Bar
                      dataKey="profit"
                      fill="#0ea5e9"
                      shape={
                        <div
                          style={{
                            fill: (bar: any) => (bar.value > 1000 ? "#10b981" : bar.value > 800 ? "#0ea5e9" : "#f59e0b")
                          }}
                        />
                      }
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* DRONES TAB */}
        {tab === "drones" && (
          <>
            <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Per-Drone Revenue</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={droneRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="id" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Efficiency Metrics</h3>
              <div className="space-y-3">
                {droneRevenue.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{d.id}</span>
                      <span className="text-sky-400">{d.efficiency.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full" style={{ width: `${d.efficiency}%` }} />
                    </div>
                    <div className="text-xs text-slate-500">{d.deliveries} deliveries</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* COSTS TAB */}
        {tab === "costs" && (
          <>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Cost Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} $${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Cost vs Profit Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="week" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="cost" fill="#ef4444" />
                    <Bar dataKey="profit" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
