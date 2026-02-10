
import React, { useState, useEffect } from 'react';
import { ViewType, Drone, DroneStatus, Alert } from './types';
import AirspaceView from './components/AirspaceView';
import FleetManager from './components/FleetManager';
import Dashboard from './components/Dashboard';
import MediaProcessor from './components/MediaProcessor';
import LoginPage from './components/LoginPage';
import { LayoutGrid, Navigation, Settings, LayoutDashboard, Bell, Search, Activity, Cpu, Sparkles } from 'lucide-react';

const INITIAL_DRONES: Drone[] = [
  { id: 'alpha-1', name: 'Alpha-1', model: 'CZ4-Heavy', status: DroneStatus.FLYING, battery: 84.2, speed: 45, maxAltitude: 500, position: { x: -100, y: 150, z: -50 }, lastUpdated: new Date().toISOString() },
  { id: 'beta-2', name: 'Beta-2', model: 'CZ4-Light', status: DroneStatus.FLYING, battery: 91.1, speed: 60, maxAltitude: 300, position: { x: 200, y: 120, z: 150 }, lastUpdated: new Date().toISOString() },
  { id: 'gamma-3', name: 'Gamma-3', model: 'CZ4-Heavy', status: DroneStatus.IDLE, battery: 100, speed: 0, maxAltitude: 500, position: { x: 0, y: 0, z: 0 }, lastUpdated: new Date().toISOString() },
  { id: 'delta-4', name: 'Delta-4', model: 'CZ5-Nano', status: DroneStatus.FLYING, battery: 12.5, speed: 30, maxAltitude: 150, position: { x: -50, y: 200, z: 80 }, lastUpdated: new Date().toISOString() },
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('3D');
  const [drones, setDrones] = useState<Drone[]>(INITIAL_DRONES);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Telemetry update simulation
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      setDrones(prev => prev.map(d => {
        if (d.status === DroneStatus.IDLE) return d;
        const newBattery = Math.max(0, d.battery - 0.05);
        return {
          ...d,
          battery: newBattery,
          status: newBattery < 10 ? DroneStatus.EMERGENCY : d.status
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleAddDrone = (newDrone: Drone) => {
    setDrones(prev => [...prev, newDrone]);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  const NavItem = ({ icon: Icon, label, type }: { icon: any, label: string, type: ViewType }) => (
    <button 
      onClick={() => setActiveView(type)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 group
        ${activeView === type ? 'bg-sky-600 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
    >
      <Icon size={20} className={activeView === type ? '' : 'group-hover:text-sky-400'} />
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0b] text-slate-200 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 glass border-r border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.5)]">
            <Cpu className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight italic uppercase">Airborne</h1>
            <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Autopilot Pro</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Operational</div>
          <NavItem icon={LayoutGrid} label="Airspace Visualizer" type="3D" />
          <NavItem icon={Navigation} label="Fleet Manager" type="FLEET" />
          <NavItem icon={Activity} label="Flight Controls" type="FLIGHTS" />
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4 pt-4">Intelligence</div>
          <NavItem icon={Sparkles} label="Media Intelligence" type="MEDIA" />
          <NavItem icon={LayoutDashboard} label="System Dashboard" type="DASHBOARD" />
        </nav>

        <div className="mt-auto space-y-4">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white transition-colors">
            <Settings size={20} />
            <span className="text-sm font-semibold">Settings</span>
          </button>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400">System Uptime</span>
              <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">Live</span>
            </div>
            <div className="text-lg font-mono font-bold">12:42:08</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 glass border-b border-slate-800 flex items-center justify-between px-10 shrink-0">
          <div className="flex items-center gap-6 w-1/3">
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search fleet by ID or position..." 
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                />
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              {drones.length} Assets Live
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-slate-900"></span>
            </button>
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 p-0.5 hover:scale-105 transition-transform"
            >
              <img src="https://picsum.photos/100/100" className="w-full h-full rounded-full object-cover" alt="User" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-slate-950/20">
          {activeView === '3D' && <AirspaceView drones={drones} />}
          {activeView === 'FLEET' && <FleetManager drones={drones} onAddDrone={handleAddDrone} />}
          {activeView === 'DASHBOARD' && <Dashboard drones={drones} />}
          {activeView === 'MEDIA' && <MediaProcessor />}
          {activeView === 'FLIGHTS' && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Navigation size={64} className="text-slate-800 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Flight Control Console</h2>
              <p className="text-slate-500 max-w-md">Initialize automated missions, calculate optimal trajectories using A*, and coordinate multi-drone logistics.</p>
              <button className="mt-8 px-8 py-3 bg-sky-600 rounded-xl font-bold hover:bg-sky-500 transition-all">Launch Mission Planner</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
