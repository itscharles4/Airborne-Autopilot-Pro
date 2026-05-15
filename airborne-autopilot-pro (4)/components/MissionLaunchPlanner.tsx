import React, { useState, useRef, useEffect } from 'react';
import { Drone, DroneStatus } from '../types';
import {
  Plus, X, MapPin, Package, Clock, Zap, AlertTriangle, CheckCircle2,
  ChevronRight, Loader, TrendingUp, Navigation, Cpu, DollarSign,
  Gauge, Shield, Maximize2, ListChecks
} from 'lucide-react';
import { getLocationAutocomplete } from '../services/googleMapsService';

interface MissionWaypoint {
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  type: 'PICKUP' | 'DROPOFF' | 'CHECKPOINT';
  sequence: number;
}

interface MissionConfig {
  name: string;
  description: string;
  missionType: 'DELIVERY' | 'SURVEY' | 'INSPECTION' | 'PATROL';
  selectedDrones: string[];
  waypoints: MissionWaypoint[];
  flightAltitude: number;
  flightSpeed: number;
  batteryReserve: number;
  weatherRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface MissionLaunchPlannerProps {
  drones: Drone[];
  onLaunch?: (mission: MissionConfig) => void;
}

const MissionLaunchPlanner: React.FC<MissionLaunchPlannerProps> = ({ drones, onLaunch }) => {
  const [step, setStep] = useState<'BASIC' | 'DRONES' | 'ROUTE' | 'PARAMS' | 'REVIEW' | 'LAUNCH'>('BASIC');
  const [mission, setMission] = useState<MissionConfig>({
    name: '',
    description: '',
    missionType: 'DELIVERY',
    selectedDrones: [],
    waypoints: [],
    flightAltitude: 150,
    flightSpeed: 40,
    batteryReserve: 20,
    weatherRisk: 'LOW',
  });

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState(-1);
  const [waypointInput, setWaypointInput] = useState('');
  const waypointInputRef = useRef<HTMLInputElement>(null);

  // Available drones - filter by status and battery
  const availableDrones = drones.filter(d => 
    d.status === DroneStatus.IDLE && d.battery >= 50 || 
    (d.status === DroneStatus.FLYING && d.battery >= 30)
  );

  // Handle waypoint search suggestions
  const handleWaypointSearch = async (value: string) => {
    setWaypointInput(value);
    if (value.length > 2) {
      setLoadingSuggestions(true);
      try {
        const predictions = await getLocationAutocomplete(value);
        setSuggestions(predictions.map(p => ({
          id: p.place_id,
          description: p.description,
          mainText: p.main_text || p.description,
        })));
        setShowSuggestions(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Add waypoint
  const addWaypoint = (suggestion?: any) => {
    const description = suggestion?.description || waypointInput;
    if (!description.trim()) return;

    const newWaypoint: MissionWaypoint = {
      id: `wp-${Date.now()}`,
      location: description,
      type: mission.waypoints.length === 0 ? 'PICKUP' : mission.waypoints.length === 1 ? 'DROPOFF' : 'CHECKPOINT',
      sequence: mission.waypoints.length + 1,
    };

    setMission(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, newWaypoint]
    }));

    setWaypointInput('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Remove waypoint
  const removeWaypoint = (id: string) => {
    setMission(prev => ({
      ...prev,
      waypoints: prev.waypoints.filter(w => w.id !== id).map((w, i) => ({ ...w, sequence: i + 1 }))
    }));
  };

  // Toggle drone selection
  const toggleDrone = (droneId: string) => {
    setMission(prev => ({
      ...prev,
      selectedDrones: prev.selectedDrones.includes(droneId)
        ? prev.selectedDrones.filter(id => id !== droneId)
        : [...prev.selectedDrones, droneId]
    }));
  };

  // Calculate mission metrics
  const calculateMetrics = () => {
    const selectedFleet = drones.filter(d => mission.selectedDrones.includes(d.id));
    const avgBattery = selectedFleet.length > 0 
      ? selectedFleet.reduce((sum, d) => sum + d.battery, 0) / selectedFleet.length 
      : 0;
    
    // Rough estimate: 1 waypoint = 10 minutes flight time
    const estimatedTime = Math.ceil(mission.waypoints.length * 12);
    
    // Cost estimation: $5 per minute of flight time per drone
    const costPerDrone = estimatedTime * 5;
    const totalCost = costPerDrone * selectedFleet.length;

    // Distance estimate: ~5km per waypoint
    const estimatedDistance = mission.waypoints.length * 5;

    // Risk assessment
    let riskScore = 0;
    if (mission.selectedDrones.length === 0) riskScore += 3;
    if (mission.waypoints.length === 0) riskScore += 3;
    if (avgBattery < 40) riskScore += 2;
    if (mission.flightAltitude > 300) riskScore += 1;
    if (mission.weatherRisk === 'HIGH') riskScore += 3;
    if (mission.weatherRisk === 'MEDIUM') riskScore += 1;

    const riskLevel = riskScore > 6 ? 'HIGH' : riskScore > 3 ? 'MEDIUM' : 'LOW';

    return {
      avgBattery: avgBattery.toFixed(1),
      estimatedTime,
      estimatedDistance,
      totalCost,
      costPerDrone,
      riskScore,
      riskLevel,
    };
  };

  const metrics = calculateMetrics();
  const isStepValid = {
    BASIC: mission.name.length > 0,
    DRONES: mission.selectedDrones.length > 0,
    ROUTE: mission.waypoints.length >= 2,
    PARAMS: true,
    REVIEW: true,
  };

  const stepConfig = [
    { id: 'BASIC', label: 'Mission Details', icon: ListChecks },
    { id: 'DRONES', label: 'Fleet Selection', icon: Cpu },
    { id: 'ROUTE', label: 'Waypoints', icon: MapPin },
    { id: 'PARAMS', label: 'Flight Parameters', icon: Gauge },
    { id: 'REVIEW', label: 'Review & Launch', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-2">
            Advanced Mission Planner
          </h1>
          <p className="text-slate-400">Design, configure, and launch optimized drone missions</p>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-5 gap-3 mb-12">
          {stepConfig.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = step === s.id;
            const isCompleted = isStepValid[s.id as keyof typeof isStepValid];
            const stepIndex = stepConfig.findIndex(sc => sc.id === step);
            const currentIndex = idx;
            const isDone = currentIndex < stepIndex;

            return (
              <button
                key={s.id}
                onClick={() => currentIndex <= stepIndex && setStep(s.id as any)}
                className={`p-4 rounded-xl border-2 transition-all group ${
                  isActive
                    ? 'bg-sky-600 border-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-sky-500/20' : isDone ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                    {isDone ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <StepIcon size={20} />
                    )}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-center">{s.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2">
            <div className="glass rounded-2xl border border-slate-800 p-8 shadow-2xl">
              {/* STEP 1: Basic Mission Details */}
              {step === 'BASIC' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-white uppercase">Mission Details</h2>
                  
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Mission Name
                    </label>
                    <input
                      type="text"
                      value={mission.name}
                      onChange={e => setMission({ ...mission, name: e.target.value })}
                      placeholder="e.g., Downtown Delivery Route A"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Description
                    </label>
                    <textarea
                      value={mission.description}
                      onChange={e => setMission({ ...mission, description: e.target.value })}
                      placeholder="Describe the mission objective..."
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all resize-none h-24"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Mission Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['DELIVERY', 'SURVEY', 'INSPECTION', 'PATROL'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setMission({ ...mission, missionType: type })}
                          className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
                            mission.missionType === type
                              ? 'bg-sky-600 border-sky-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('DRONES')}
                    disabled={!isStepValid.BASIC}
                    className="w-full mt-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                  >
                    Continue <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {/* STEP 2: Fleet Selection */}
              {step === 'DRONES' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-white uppercase">Select Drones</h2>
                  <p className="text-sm text-slate-400">Choose available drones for this mission</p>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableDrones.length > 0 ? (
                      availableDrones.map(drone => (
                        <button
                          key={drone.id}
                          onClick={() => toggleDrone(drone.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            mission.selectedDrones.includes(drone.id)
                              ? 'bg-sky-600/20 border-sky-500'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-4 h-4 rounded border-2 ${
                                mission.selectedDrones.includes(drone.id)
                                  ? 'bg-sky-500 border-sky-500'
                                  : 'border-slate-600'
                              }`} />
                              <div>
                                <div className="font-bold text-white">{drone.name}</div>
                                <div className="text-xs text-slate-500">{drone.model}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className={`text-sm font-bold ${
                                  drone.battery < 30 ? 'text-rose-400' : 'text-emerald-400'
                                }`}>
                                  {drone.battery.toFixed(0)}%
                                </div>
                                <div className="text-xs text-slate-500">Battery</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                drone.status === DroneStatus.FLYING
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {drone.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800">
                        <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
                        <p className="text-slate-400">No available drones for mission</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('BASIC')}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('ROUTE')}
                      disabled={!isStepValid.DRONES}
                      className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase transition-all flex items-center justify-center gap-2"
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Route/Waypoints */}
              {step === 'ROUTE' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-white uppercase">Mission Waypoints</h2>
                  <p className="text-sm text-slate-400">Add pickup, dropoff, and checkpoint locations</p>

                  {/* Waypoint Input */}
                  <div className="relative">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Add Waypoint
                    </label>
                    <div className="relative">
                      <input
                        ref={waypointInputRef}
                        type="text"
                        value={waypointInput}
                        onChange={e => handleWaypointSearch(e.target.value)}
                        onFocus={() => waypointInput.length > 2 && setShowSuggestions(true)}
                        placeholder="Search location..."
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                      {loadingSuggestions && (
                        <Loader size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 animate-spin" />
                      )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-sky-500/20 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                        {suggestions.map(suggestion => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => addWaypoint(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-sky-500/10 border-b border-slate-800 last:border-0 transition-colors"
                          >
                            <div className="text-xs text-sky-400 font-bold">{suggestion.mainText}</div>
                            <div className="text-[10px] text-slate-500 truncate">{suggestion.description}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => addWaypoint()}
                      disabled={!waypointInput.trim()}
                      className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold uppercase text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Waypoint
                    </button>
                  </div>

                  {/* Waypoints List */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Waypoints ({mission.waypoints.length})</h3>
                    {mission.waypoints.length > 0 ? (
                      <div className="space-y-2">
                        {mission.waypoints.map((wp, idx) => (
                          <div key={wp.id} className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold text-white">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-white truncate">{wp.location}</div>
                              <div className="text-xs text-slate-500">{wp.type}</div>
                            </div>
                            <button
                              onClick={() => removeWaypoint(wp.id)}
                              className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-6">No waypoints added yet</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('DRONES')}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('PARAMS')}
                      disabled={!isStepValid.ROUTE}
                      className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase transition-all flex items-center justify-center gap-2"
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Flight Parameters */}
              {step === 'PARAMS' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-white uppercase">Flight Parameters</h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                        Flight Altitude (meters)
                      </label>
                      <input
                        type="number"
                        value={mission.flightAltitude}
                        onChange={e => setMission({ ...mission, flightAltitude: parseInt(e.target.value) || 150 })}
                        min="50"
                        max="500"
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                      <div className="mt-2 text-xs text-slate-500">Range: 50-500m</div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                        Flight Speed (km/h)
                      </label>
                      <input
                        type="number"
                        value={mission.flightSpeed}
                        onChange={e => setMission({ ...mission, flightSpeed: parseInt(e.target.value) || 40 })}
                        min="10"
                        max="80"
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                      <div className="mt-2 text-xs text-slate-500">Range: 10-80 km/h</div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                        Battery Reserve (%)
                      </label>
                      <input
                        type="number"
                        value={mission.batteryReserve}
                        onChange={e => setMission({ ...mission, batteryReserve: parseInt(e.target.value) || 20 })}
                        min="10"
                        max="50"
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      />
                      <div className="mt-2 text-xs text-slate-500">Safety margin for return</div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                        Weather Risk
                      </label>
                      <select
                        value={mission.weatherRisk}
                        onChange={e => setMission({ ...mission, weatherRisk: e.target.value as any })}
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      >
                        <option value="LOW">Low Risk ✓</option>
                        <option value="MEDIUM">Medium Risk ⚠</option>
                        <option value="HIGH">High Risk ✗</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('ROUTE')}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('REVIEW')}
                      className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold uppercase transition-all flex items-center justify-center gap-2"
                    >
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Review & Launch */}
              {step === 'REVIEW' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-white uppercase">Review & Launch</h2>

                  <div className="space-y-4">
                    {/* Mission Summary */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <h3 className="font-bold text-white mb-3">Mission Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Name:</span>
                          <span className="text-white font-bold">{mission.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Type:</span>
                          <span className="text-white font-bold">{mission.missionType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Drones:</span>
                          <span className="text-white font-bold">{mission.selectedDrones.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Waypoints:</span>
                          <span className="text-white font-bold">{mission.waypoints.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Selected Drones */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <h3 className="font-bold text-white mb-3">Assigned Drones</h3>
                      <div className="space-y-2">
                        {drones.filter(d => mission.selectedDrones.includes(d.id)).map(d => (
                          <div key={d.id} className="flex justify-between text-sm">
                            <span className="text-slate-400">{d.name}</span>
                            <span className="text-emerald-400 font-bold">{d.battery.toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Waypoints */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <h3 className="font-bold text-white mb-3">Route ({mission.waypoints.length} stops)</h3>
                      <div className="space-y-1 text-sm">
                        {mission.waypoints.map((wp, idx) => (
                          <div key={wp.id} className="text-slate-400">
                            {idx + 1}. {wp.location}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('PARAMS')}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        onLaunch?.(mission);
                        setStep('LAUNCH');
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Launch Mission
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: Launch Confirmation */}
              {step === 'LAUNCH' && (
                <div className="space-y-6 text-center py-12">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase mb-2">Mission Launched!</h2>
                    <p className="text-slate-400">{mission.name} is now active</p>
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <p>✓ {mission.selectedDrones.length} drone(s) deployed</p>
                    <p>✓ {mission.waypoints.length} waypoint(s) planned</p>
                    <p>✓ Est. duration: {metrics.estimatedTime} minutes</p>
                  </div>
                  <button
                    onClick={() => {
                      setStep('BASIC');
                      setMission({
                        name: '',
                        description: '',
                        missionType: 'DELIVERY',
                        selectedDrones: [],
                        waypoints: [],
                        flightAltitude: 150,
                        flightSpeed: 40,
                        batteryReserve: 20,
                        weatherRisk: 'LOW',
                      });
                    }}
                    className="mt-8 px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold uppercase transition-all"
                  >
                    Plan Another Mission
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Mission Preview */}
          <div className="glass rounded-2xl border border-slate-800 p-6 shadow-2xl h-fit">
            <h3 className="text-lg font-black text-white uppercase mb-6">Mission Preview</h3>

            <div className="space-y-5">
              {/* Mission Info */}
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Mission</p>
                <p className="text-sm text-white font-bold mt-1">{mission.name || 'Unnamed'}</p>
              </div>

              {/* Fleet Info */}
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Fleet ({mission.selectedDrones.length})</p>
                {mission.selectedDrones.length > 0 ? (
                  <div className="space-y-1">
                    {drones.filter(d => mission.selectedDrones.includes(d.id)).map(d => (
                      <div key={d.id} className="flex justify-between text-xs">
                        <span className="text-slate-400">{d.name}</span>
                        <span className="text-emerald-400">{d.battery.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No drones selected</p>
                )}
              </div>

              {/* Metrics */}
              <div className="border-t border-slate-700 pt-5">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-3">Metrics</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Clock size={14} /> Duration
                    </span>
                    <span className="text-white font-bold">{metrics.estimatedTime}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Navigation size={14} /> Distance
                    </span>
                    <span className="text-white font-bold">{metrics.estimatedDistance}km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Zap size={14} /> Battery Avg
                    </span>
                    <span className={`font-bold ${parseFloat(metrics.avgBattery) < 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {metrics.avgBattery}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-2">
                      <DollarSign size={14} /> Estimated Cost
                    </span>
                    <span className="text-white font-bold">${metrics.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="border-t border-slate-700 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Risk Level</p>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    metrics.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                    metrics.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {metrics.riskLevel}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      metrics.riskScore > 6 ? 'bg-rose-500' :
                      metrics.riskScore > 3 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(metrics.riskScore * 15, 100)}%` }}
                  />
                </div>
              </div>

              {/* Waypoints */}
              <div className="border-t border-slate-700 pt-5">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Waypoints ({mission.waypoints.length})</p>
                {mission.waypoints.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {mission.waypoints.map((wp, idx) => (
                      <div key={wp.id} className="text-[11px] text-slate-400 flex gap-2">
                        <span className="text-slate-600">{idx + 1}.</span>
                        <span className="truncate">{wp.location}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">No waypoints</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionLaunchPlanner;
