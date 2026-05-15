
import React, { useState, useEffect } from 'react';
import { ViewType, Drone, DroneStatus, Alert } from './types';
import AirspaceView from './components/AirspaceView';
import FleetManager from './components/FleetManager';
import Dashboard from './components/Dashboard';
import MediaProcessor from './components/MediaProcessor';
import LoginPage from './components/LoginPage';
import DroneHealthScore from './components/DroneHealthScore';
import AIMissionPlanner from './components/AIMissionPlanner';
import TSPOptimizer from './components/TSPOptimizer';
import FlightReplay from './components/FlightReplay';
import RevenueDashboard from './components/RevenueDashboard';
import PredictiveMaintenance from './components/PredictiveMaintenance';
import MissionLaunchPlanner from './components/MissionLaunchPlanner';
import SettingsModal from './components/SettingsModal';
import { LayoutGrid, Navigation, Settings, LayoutDashboard, Bell, Search, Activity, Cpu, Sparkles, Route, Clock, BarChart2, Bot, Wrench } from 'lucide-react';

const INITIAL_DRONES: Drone[] = [
  { id: 'alpha-1', name: 'Alpha-1', model: 'CZ4-Heavy', status: DroneStatus.FLYING, battery: 84.2, speed: 45, maxAltitude: 500, position: { x: -100, y: 150, z: -50 }, lastUpdated: new Date().toISOString() },
  { id: 'beta-2', name: 'Beta-2', model: 'CZ4-Light', status: DroneStatus.FLYING, battery: 91.1, speed: 60, maxAltitude: 300, position: { x: 200, y: 120, z: 150 }, lastUpdated: new Date().toISOString() },
  { id: 'gamma-3', name: 'Gamma-3', model: 'CZ4-Heavy', status: DroneStatus.IDLE, battery: 100, speed: 0, maxAltitude: 500, position: { x: 0, y: 0, z: 0 }, lastUpdated: new Date().toISOString() },
  { id: 'delta-4', name: 'Delta-4', model: 'CZ5-Nano', status: DroneStatus.FLYING, battery: 12.5, speed: 30, maxAltitude: 150, position: { x: -50, y: 200, z: 80 }, lastUpdated: new Date().toISOString() },
  { id: 'echo-5', name: 'Echo-5', model: 'CZ4-Heavy', status: DroneStatus.FLYING, battery: 75.3, speed: 55, maxAltitude: 500, position: { x: 300, y: -150, z: 120 }, lastUpdated: new Date().toISOString() },
  { id: 'foxtrot-6', name: 'Foxtrot-6', model: 'CZ4-Light', status: DroneStatus.FLYING, battery: 68.9, speed: 48, maxAltitude: 400, position: { x: -250, y: -100, z: 95 }, lastUpdated: new Date().toISOString() },
  { id: 'golf-7', name: 'Golf-7', model: 'CZ5-Nano', status: DroneStatus.IDLE, battery: 100, speed: 0, maxAltitude: 200, position: { x: 150, y: -200, z: 0 }, lastUpdated: new Date().toISOString() },
  { id: 'hotel-8', name: 'Hotel-8', model: 'CZ4-Heavy', status: DroneStatus.FLYING, battery: 55.7, speed: 42, maxAltitude: 500, position: { x: -180, y: 250, z: 110 }, lastUpdated: new Date().toISOString() },
  { id: 'india-9', name: 'India-9', model: 'CZ4-Light', status: DroneStatus.FLYING, battery: 82.4, speed: 58, maxAltitude: 350, position: { x: 220, y: 180, z: 85 }, lastUpdated: new Date().toISOString() },
  { id: 'juliet-10', name: 'Juliet-10', model: 'CZ5-Nano', status: DroneStatus.FLYING, battery: 43.2, speed: 35, maxAltitude: 250, position: { x: -320, y: -180, z: 60 }, lastUpdated: new Date().toISOString() },
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('3D');
  const [drones, setDrones] = useState<Drone[]>(INITIAL_DRONES);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [currentIST, setCurrentIST] = useState('00:00:00');

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

  // System uptime timer - IST time
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const updateIST = () => {
      const now = new Date();
      // Use intl to get proper IST time
      const istFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      const parts = istFormatter.formatToParts(now);
      const hour = parts.find(p => p.type === 'hour')?.value || '00';
      const minute = parts.find(p => p.type === 'minute')?.value || '00';
      const second = parts.find(p => p.type === 'second')?.value || '00';
      
      setCurrentIST(`${hour}:${minute}:${second}`);
    };
    
    updateIST();
    const interval = setInterval(updateIST, 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleAddDrone = (newDrone: Drone) => {
    setDrones(prev => [...prev, newDrone]);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => {
      setIsLoggedIn(true);
      // Store a mock JWT token for API calls
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTB1c2VyIiwiZW1haWwiOiJkZW1vQGFpcmJvcm5lLmNvbSIsImlhdCI6MTcwMDU4NzQ4OH0.nH5xQkHK_qCdE7vqJvAjF8LrMj8UXfA7t3J4K8LdP1w');
    }} />;
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

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4">Operational</div>
          <NavItem icon={LayoutGrid} label="Airspace Visualizer" type="3D" />
          <NavItem icon={Navigation} label="Fleet Manager" type="FLEET" />
          <NavItem icon={Activity} label="Flight Controls" type="FLIGHTS" />
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4 pt-4">Intelligence</div>
          <NavItem icon={Sparkles} label="Media Intelligence" type="MEDIA" />
          <NavItem icon={LayoutDashboard} label="System Dashboard" type="DASHBOARD" />
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-4 pt-4">Advanced</div>
          <NavItem icon={Activity} label="Drone Health" type="HEALTH" />
          <NavItem icon={Bot} label="AI Mission Plan" type="MISSION" />
          <NavItem icon={Route} label="Route Optimizer" type="ROUTES" />
          <NavItem icon={Clock} label="Flight Replay" type="REPLAY" />
          <NavItem icon={BarChart2} label="Revenue & Analytics" type="REVENUE" />
          <NavItem icon={Wrench} label="Predictive Maintenance" type="MAINTENANCE" />
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200 cursor-pointer"
          >
            <Settings size={20} />
            <span className="text-sm font-semibold">Settings</span>
          </button>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400">System Time (IST)</span>
              <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded">Live</span>
            </div>
            <div className="text-lg font-mono font-bold">{currentIST}</div>
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
          {activeView === 'HEALTH' && <DroneHealthScore drones={drones} />}
          {activeView === 'MISSION' && <AIMissionPlanner drones={drones} />}
          {activeView === 'ROUTES' && <TSPOptimizer />}
          {activeView === 'REPLAY' && <FlightReplay drones={drones} />}
          {activeView === 'REVENUE' && <RevenueDashboard drones={drones} />}
          {activeView === 'MAINTENANCE' && <PredictiveMaintenance drones={drones} />}
          {activeView === 'FLIGHTS' && (
            <MissionLaunchPlanner 
              drones={drones} 
              onLaunch={(mission) => {
                console.log('Mission launched:', mission);
                // Add your mission launch logic here
              }}
            />
          )}
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default App;
