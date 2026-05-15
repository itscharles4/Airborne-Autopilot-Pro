
import React, { useState, useRef, useEffect } from 'react';
import { Drone, DroneStatus } from '../types';
import { Battery, Trash2, Settings, ShieldAlert, Cpu, Navigation, X, MapPin, Plus, Package, LogIn, LogOut, Loader } from 'lucide-react';
import { getLocationAutocomplete, getPlaceDetailsFromId } from '../services/googleMapsService';

interface FleetManagerProps {
  drones: Drone[];
  onAddDrone: (drone: Drone) => void;
}

interface Suggestion {
  placeId: string;
  description: string;
  mainText: string;
}

const FleetManager: React.FC<FleetManagerProps> = ({ drones, onAddDrone }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    pickupLocation: '',
    dropLocation: '',
    targetX: '',
    targetZ: ''
  });

  // Autocomplete state
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<Suggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [loadingPickup, setLoadingPickup] = useState(false);
  const [loadingDrop, setLoadingDrop] = useState(false);

  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);

  // Handle pickup location autocomplete
  const handlePickupChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, pickupLocation: value });

    if (value.length > 2) {
      setLoadingPickup(true);
      try {
        const predictions = await getLocationAutocomplete(value);
        setPickupSuggestions(
          predictions.map(p => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.main_text || p.description,
          }))
        );
        setShowPickupSuggestions(true);
      } catch (err) {
        console.error('Pickup autocomplete error:', err);
      } finally {
        setLoadingPickup(false);
      }
    } else {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
    }
  };

  // Handle drop location autocomplete
  const handleDropChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, dropLocation: value });

    if (value.length > 2) {
      setLoadingDrop(true);
      try {
        const predictions = await getLocationAutocomplete(value);
        setDropSuggestions(
          predictions.map(p => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.main_text || p.description,
          }))
        );
        setShowDropSuggestions(true);
      } catch (err) {
        console.error('Drop autocomplete error:', err);
      } finally {
        setLoadingDrop(false);
      }
    } else {
      setDropSuggestions([]);
      setShowDropSuggestions(false);
    }
  };

  // Handle suggestion selection for pickup
  const handlePickupSelect = async (suggestion: Suggestion) => {
    setFormData({ ...formData, pickupLocation: suggestion.description });
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
  };

  // Handle suggestion selection for drop
  const handleDropSelect = async (suggestion: Suggestion) => {
    setFormData({ ...formData, dropLocation: suggestion.description });
    setShowDropSuggestions(false);
    setDropSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDrone: Drone = {
      id: formData.id || `drone-${Date.now()}`,
      name: formData.name || 'Unassigned Unit',
      model: 'CZ4-Light',
      status: DroneStatus.IDLE,
      battery: 100,
      position: { x: 0, y: 0, z: 0 },
      speed: 0,
      maxAltitude: 200,
      lastUpdated: new Date().toISOString()
    };
    onAddDrone(newDrone);
    setIsModalOpen(false);
    setFormData({ id: '', name: '', pickupLocation: '', dropLocation: '', targetX: '', targetZ: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Fleet Management</h2>
          <p className="text-slate-400 mt-1">Configure and monitor your autonomous drone assets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all shadow-[0_10px_30px_-10px_rgba(14,165,233,0.5)] active:scale-95"
        >
          <Plus size={18} />
          Deploy New Drone
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: drones.length, icon: Cpu, color: 'text-sky-400' },
          { label: 'Operational', value: drones.filter(d => d.status === DroneStatus.FLYING).length, icon: ShieldAlert, color: 'text-emerald-400' },
          { label: 'Low Battery', value: drones.filter(d => d.battery < 20).length, icon: Battery, color: 'text-amber-400' },
          { label: 'Network Health', value: '100%', icon: ShieldAlert, color: 'text-violet-400' },
        ].map((stat, idx) => (
          <div key={idx} className="glass p-6 rounded-2xl border border-slate-800/50 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="text-3xl font-bold text-white tracking-tighter">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Fleet Table */}
      <div className="glass rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
              <th className="px-6 py-5">Drone Ident</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Battery</th>
              <th className="px-6 py-5">Position (X, Y, Z)</th>
              <th className="px-6 py-5">Last Communication</th>
              <th className="px-6 py-5 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {drones.map(drone => (
              <tr key={drone.id} className="hover:bg-sky-500/5 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 group-hover:border-sky-500/30 transition-colors shadow-inner">
                      <Navigation size={18} className="text-sky-400" />
                    </div>
                    <div>
                      <div className="font-black text-slate-200 tracking-wide uppercase text-xs">{drone.name}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{drone.model} • {drone.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    drone.status === DroneStatus.FLYING ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    drone.status === DroneStatus.EMERGENCY ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {drone.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ${drone.battery < 20 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-sky-500 shadow-[0_0_10px_#0ea5e9]'}`}
                        style={{ width: `${drone.battery}%` }}
                      ></div>
                    </div>
                    <span className={`text-[11px] font-black font-mono ${drone.battery < 20 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>{Math.round(drone.battery)}%</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-[11px] font-mono text-slate-400 font-bold">
                  [{Math.round(drone.position.x)}, {Math.round(drone.position.y)}, {Math.round(drone.position.z)}]
                </td>
                <td className="px-6 py-5 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  {new Date(drone.lastUpdated).toLocaleTimeString()}
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button className="p-2.5 bg-slate-800 hover:bg-sky-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-lg">
                      <Settings size={16} />
                    </button>
                    <button className="p-2.5 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all shadow-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deployment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-lg glass p-8 rounded-[2rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
            <header className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Fleet Insertion</h3>
                <p className="text-sm text-slate-400 mt-1 font-medium">Initialize a new autonomous delivery unit.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                <X size={24} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Asset ID No.</label>
                  <div className="relative group">
                    <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={formData.id}
                      onChange={e => setFormData({...formData, id: e.target.value})}
                      placeholder="e.g. CZ-994" 
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Tactical Callsign</label>
                  <div className="relative group">
                    <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Phoenix One" 
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-bold"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pickup & Drop Locations */}
              <div className="p-6 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/20 space-y-4">
                <div className="flex items-center gap-3 text-emerald-400 mb-4">
                  <MapPin size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Delivery Route</span>
                </div>
                
                {/* Pickup Location */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <LogIn size={14} className="text-emerald-400" />
                    Pickup Location
                  </label>
                  <div className="relative">
                    <input 
                      ref={pickupInputRef}
                      type="text" 
                      value={formData.pickupLocation}
                      onChange={handlePickupChange}
                      onFocus={() => formData.pickupLocation.length > 2 && setShowPickupSuggestions(true)}
                      placeholder="e.g. Downtown Hub, 123 Main St" 
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                    />
                    {loadingPickup && (
                      <Loader size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />
                    )}
                  </div>

                  {/* Pickup Suggestions Dropdown */}
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-emerald-500/20 rounded-xl shadow-2xl z-[110] max-h-48 overflow-y-auto">
                      {pickupSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          onClick={() => handlePickupSelect(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-emerald-500/10 border-b border-slate-800 last:border-0 transition-colors group"
                        >
                          <div className="text-xs text-emerald-400 font-bold group-hover:text-emerald-300">{suggestion.mainText}</div>
                          <div className="text-[10px] text-slate-500 truncate">{suggestion.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drop Location */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <LogOut size={14} className="text-rose-400" />
                    Drop Location
                  </label>
                  <div className="relative">
                    <input 
                      ref={dropInputRef}
                      type="text" 
                      value={formData.dropLocation}
                      onChange={handleDropChange}
                      onFocus={() => formData.dropLocation.length > 2 && setShowDropSuggestions(true)}
                      placeholder="e.g. Harbor Terminal, 456 Port Ave" 
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
                      required
                    />
                    {loadingDrop && (
                      <Loader size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 animate-spin" />
                    )}
                  </div>

                  {/* Drop Suggestions Dropdown */}
                  {showDropSuggestions && dropSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-rose-500/20 rounded-xl shadow-2xl z-[110] max-h-48 overflow-y-auto">
                      {dropSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          onClick={() => handleDropSelect(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-rose-500/10 border-b border-slate-800 last:border-0 transition-colors group"
                        >
                          <div className="text-xs text-rose-400 font-bold group-hover:text-rose-300">{suggestion.mainText}</div>
                          <div className="text-[10px] text-slate-500 truncate">{suggestion.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-900/40 rounded-[1.5rem] border border-white/5 space-y-4">
                <div className="flex items-center gap-3 text-sky-400 mb-2">
                  <MapPin size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Delivery Vector</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <input 
                      type="number" 
                      value={formData.targetX}
                      onChange={e => setFormData({...formData, targetX: e.target.value})}
                      placeholder="X Coordinate" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="number" 
                      value={formData.targetZ}
                      onChange={e => setFormData({...formData, targetZ: e.target.value})}
                      placeholder="Z Coordinate" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase italic">* Unit will initialize at HQ (0,0,0) before proceeding to vector.</p>
              </div>

              <button 
                type="submit" 
                className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] flex items-center justify-center gap-3 group active:scale-95"
              >
                <Package size={20} className="group-hover:scale-110 transition-transform" />
                Authorize Deployment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetManager;
