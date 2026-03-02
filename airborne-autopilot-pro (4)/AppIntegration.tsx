import { useState } from "react";
import { LayoutGrid, Navigation, Settings, LayoutDashboard, Sparkles, Cpu, Route, Clock, BarChart2, Bot } from "lucide-react";
import { ViewType } from "./types";

import DroneHealthScore from "./components/DroneHealthScore";
import AIMissionPlanner from "./components/AIMissionPlanner";
import TSPOptimizer from "./components/TSPOptimizer";
import FlightReplay from "./components/FlightReplay";
import RevenueDashboard from "./components/RevenueDashboard";

// Mock drone data for testing
const DEMO_DRONES = [
  { id: 'alpha-1', name: 'Alpha-1', model: 'CZ4-Heavy', status: 'FLYING', battery: 84.2, speed: 45, maxAltitude: 500, position: { x: -100, y: 150, z: -50 }, lastUpdated: new Date().toISOString() },
  { id: 'beta-2', name: 'Beta-2', model: 'CZ4-Light', status: 'FLYING', battery: 91.1, speed: 60, maxAltitude: 300, position: { x: 200, y: 120, z: 150 }, lastUpdated: new Date().toISOString() },
  { id: 'gamma-3', name: 'Gamma-3', model: 'CZ4-Heavy', status: 'IDLE', battery: 100, speed: 0, maxAltitude: 500, position: { x: 0, y: 0, z: 0 }, lastUpdated: new Date().toISOString() },
  { id: 'delta-4', name: 'Delta-4', model: 'CZ5-Nano', status: 'FLYING', battery: 12.5, speed: 30, maxAltitude: 150, position: { x: -50, y: 200, z: 80 }, lastUpdated: new Date().toISOString() },
];

const TABS: Array<{ id: ViewType; label: string; icon: any }> = [
  { id: 'HEALTH', label: 'Drone Health Score', icon: LayoutGrid },
  { id: 'MISSION', label: 'AI Mission Planner', icon: Bot },
  { id: 'ROUTES', label: 'TSP Route Optimizer', icon: Route },
  { id: 'REPLAY', label: 'Flight Replay', icon: Clock },
  { id: 'REVENUE', label: 'Revenue Dashboard', icon: BarChart2 },
];

export default function AppIntegration() {
  const [activeTab, setActiveTab] = useState<ViewType>('HEALTH');

  return (
    <div className="flex h-screen w-full bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Advanced Features</h1>
          <p className="text-sm text-slate-400 mt-2">Module Test Environment</p>
        </div>

        <nav className="flex-1 space-y-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-semibold text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-700">
          <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-300">
            <p className="font-semibold mb-2">Test Fleet Connected</p>
            <p>{DEMO_DRONES.length} drones active</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'HEALTH' && <DroneHealthScore drones={DEMO_DRONES} />}
        {activeTab === 'MISSION' && <AIMissionPlanner drones={DEMO_DRONES} />}
        {activeTab === 'ROUTES' && <TSPOptimizer />}
        {activeTab === 'REPLAY' && <FlightReplay drones={DEMO_DRONES} />}
        {activeTab === 'REVENUE' && <RevenueDashboard drones={DEMO_DRONES} />}
      </main>
    </div>
  );
}
