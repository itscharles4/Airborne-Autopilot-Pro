import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Drone, DroneStatus } from '../types';
import { 
  Navigation, RotateCcw, Play, Pause, MapPin, 
  Battery, Zap, Activity, Box, Package, 
  Home, Building as OfficeBuilding, HeartPulse, Factory, ListFilter, X, ChevronRight, Search, Radar, ExternalLink, RefreshCcw, User
} from 'lucide-react';
import { searchNearbyPlaces } from '../services/geminiService';

interface AirspaceViewProps {
  drones: Drone[];
}

type BuildingType = 'RESIDENTIAL' | 'COMMERCIAL' | 'MEDICAL' | 'INDUSTRIAL' | 'LOGISTICS';

interface Building {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  isHub: boolean;
  type: BuildingType;
}

const COLLISION_THRESHOLD = 40; 

const generateCity = (): Building[] => {
  const buildings: Building[] = [];
  const hubLocations = [
    { x: -280, z: -280, type: 'LOGISTICS' as BuildingType, color: '#fbbf24' },
    { x: 280, z: -280, type: 'LOGISTICS' as BuildingType, color: '#f59e0b' },
    { x: -280, z: 280, type: 'LOGISTICS' as BuildingType, color: '#fbbf24' },
    { x: 280, z: 280, type: 'LOGISTICS' as BuildingType, color: '#f59e0b' }
  ];
  
  const types: BuildingType[] = ['RESIDENTIAL', 'COMMERCIAL', 'MEDICAL', 'INDUSTRIAL'];
  const colors = ['#1e293b', '#334155', '#475569']; 
  
  for (let x = -350; x <= 350; x += 100) {
    for (let z = -350; z <= 350; z += 100) {
      const hub = hubLocations.find(h => h.x === x && h.z === z);
      
      if (hub) {
        buildings.push({
          id: `hub-${x}-${z}`,
          x, z,
          w: 65, d: 65, h: 320,
          color: hub.color,
          isHub: true,
          type: 'LOGISTICS'
        });
        continue;
      }

      if (Math.random() > 0.4) {
        const distFromCenter = Math.sqrt(x*x + z*z);
        const height = Math.max(50, 240 - (distFromCenter / 1.8) + (Math.random() * 60));
        const bType = types[Math.floor(Math.random() * types.length)];
        
        buildings.push({
          id: `bld-${x}-${z}`,
          x, z,
          w: 40 + Math.random() * 35,
          d: 40 + Math.random() * 35,
          h: height,
          color: colors[Math.floor(Math.random() * colors.length)],
          isHub: false,
          type: bType
        });
      }
    }
  }
  return buildings;
};

const BuildingIcon = ({ type, size = 12, className }: { type: BuildingType, size?: number, className?: string }) => {
  switch (type) {
    case 'RESIDENTIAL': return <Home size={size} className={className} />;
    case 'COMMERCIAL': return <OfficeBuilding size={size} className={className} />;
    case 'MEDICAL': return <HeartPulse size={size} className={className} />;
    case 'INDUSTRIAL': return <Factory size={size} className={className} />;
    case 'LOGISTICS': return <Box size={size} className={className} />;
    default: return <Package size={size} className={className} />;
  }
};

const Building3D = React.memo(({ b, onHover, isHighlighted, landmarkTitle }: { b: Building, onHover: (b: Building | null) => void, isHighlighted?: boolean, landmarkTitle?: string }) => {
  return (
    <div 
      className={`absolute group transition-all duration-500 ${isHighlighted ? 'scale-110' : ''}`}
      onMouseEnter={() => onHover(b)}
      onMouseLeave={() => onHover(null)}
      style={{ 
        left: `${400 + b.x}px`, 
        top: `${400 + b.z}px`,
        transformStyle: 'preserve-3d',
        width: `${b.w}px`,
        height: `${b.d}px`,
        transform: `translate(-50%, -50%)`
      }}
    >
      {isHighlighted && (
        <div className="absolute inset-[-50px] border-[10px] border-emerald-500/20 rounded-full animate-ping translate-z-[-10px]" />
      )}
      <div className="absolute inset-[-15px] bg-black/60 blur-xl translate-z-[-2px] opacity-40" />

      <div className="absolute inset-0 origin-bottom border border-white/5 bg-slate-800/50 backdrop-blur-[2px]" 
           style={{ 
             transform: `rotateX(-90deg) translateZ(${b.d/2}px)`, 
             height: `${b.h}px`, width: `${b.w}px`, bottom: 0,
             background: isHighlighted ? 'linear-gradient(to top, #10b981, rgba(16, 185, 129, 0.2))' : `linear-gradient(to top, rgba(15, 23, 42, 0.9), rgba(51, 65, 85, 0.4))`
           }}>
      </div>
      <div className="absolute inset-0 origin-bottom border border-white/5 bg-slate-900/60" 
           style={{ transform: `rotateX(-90deg) translateZ(${-b.d/2}px)`, height: `${b.h}px`, width: `${b.w}px`, bottom: 0 }} />
      <div className="absolute inset-0 origin-bottom border border-white/5 bg-slate-950/70" 
           style={{ transform: `rotateX(-90deg) rotateY(-90deg) translateZ(${b.w/2}px)`, height: `${b.h}px`, width: `${b.d}px`, bottom: 0 }} />
      <div className="absolute inset-0 origin-bottom border border-white/5 bg-slate-700/50" 
           style={{ transform: `rotateX(-90deg) rotateY(90deg) translateZ(${b.w/2}px)`, height: `${b.h}px`, width: `${b.d}px`, bottom: 0 }} />
      
      <div className="absolute inset-0 border border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] overflow-hidden" 
           style={{ 
             transform: `translateZ(${b.h}px)`, 
             backgroundColor: isHighlighted ? '#065f46' : b.isHub ? `${b.color}22` : '#1e293b',
             boxShadow: isHighlighted ? '0 0 40px #10b981' : b.isHub ? `inset 0 0 30px ${b.color}33` : 'none'
           }}>
         <div className="absolute inset-0 flex items-center justify-center">
            {isHighlighted ? (
                <div className="flex flex-col items-center gap-1">
                   <Radar size={24} className="text-white animate-pulse" />
                   {landmarkTitle && <span className="absolute -bottom-10 whitespace-nowrap bg-emerald-600 text-[8px] font-black px-2 py-1 rounded text-white border border-emerald-400/50 shadow-lg">{landmarkTitle}</span>}
                </div>
            ) : b.isHub ? (
               <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center animate-[spin_10s_linear_infinite]" style={{ borderColor: '#fbbf24' }}>
                    <Box size={16} className="text-amber-400 rotate-[-45deg]" />
                  </div>
               </div>
            ) : (
               <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 rounded-lg border-2 border-sky-500/30 flex items-center justify-center bg-sky-950/40">
                    <BuildingIcon type={b.type} size={12} className="text-sky-400" />
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
});

const AirspaceView: React.FC<AirspaceViewProps> = ({ drones }) => {
  const [rotation, setRotation] = useState({ x: 62, z: 45 });
  const [isPaused, setIsPaused] = useState(false);
  const [showManifest, setShowManifest] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [localLandmarks, setLocalLandmarks] = useState<any[]>([]);
  const [highlightedBuildingId, setHighlightedBuildingId] = useState<string | null>(null);
  const [userLocationSet, setUserLocationSet] = useState(false);
  
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, z: 0, rawX: 0, rawY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const cityMap = useMemo(() => generateCity(), []);
  
  // Deterministic mapping between real-world landmark index and procedural building ID
  const [landmarkMappings, setLandmarkMappings] = useState<Record<number, string>>({});

  const [simulatedDrones, setSimulatedDrones] = useState<Drone[]>(drones);
  const [collidingDroneIds, setCollidingDroneIds] = useState<Set<string>>(new Set());

  // Fix: Explicitly narrow the 'existing' drone to an object type to satisfy TypeScript spread constraints (Error on line 184)
  useEffect(() => {
    setSimulatedDrones(prev => {
      const existingMap = new Map<string, Drone>(prev.map(d => [d.id, d]));
      return drones.map(d => {
        const existing = existingMap.get(d.id);
        if (existing && typeof existing === 'object') {
          // Explicit spread of an object type after truthy and object check
          return { ...existing, battery: d.battery, status: d.status };
        }
        return d;
      });
    });
  }, [drones]);

  const handleScanLocation = () => {
    if (isScanning) return;
    setIsScanning(true);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setUserLocationSet(true);
        
        try {
          const result = await searchNearbyPlaces(latitude, longitude);
          setLocalLandmarks(result.chunks);
          
          // Deterministically map each found landmark to a building in the 3D model
          const newMappings: Record<number, string> = {};
          // Use building index offset to prevent overlaps
          result.chunks.forEach((_, idx) => {
            const bIndex = (idx * 7) % cityMap.length; // Spread them out
            newMappings[idx] = cityMap[bIndex].id;
          });
          setLandmarkMappings(newMappings);
          
          // Auto-highlight the first discovered asset
          if (result.chunks.length > 0 && newMappings[0]) {
              setHighlightedBuildingId(newMappings[0]);
          }
        } catch (error) {
          console.error("Scan failed", error);
        } finally {
          setIsScanning(false);
        }
      },
      (err) => {
        console.error("Location access denied", err);
        setIsScanning(false);
        alert("Sector synchronization requires active Geolocation permissions. Please enable and retry.");
      }
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMousePos({ 
      x: Math.round(x * (800 / rect.width)), 
      z: Math.round(y * (800 / rect.height)),
      rawX: e.clientX,
      rawY: e.clientY
    });
  };

  // Fix: Ensure that the drone object is treated strictly as an object during state updates
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSimulatedDrones(prev => {
        const nextDrones = prev.map(d => ({
          ...d,
          position: {
            x: d.status === DroneStatus.FLYING ? d.position.x + (Math.random() - 0.5) * 5 : d.position.x,
            y: d.status === DroneStatus.FLYING ? Math.max(50, d.position.y + (Math.random() - 0.5) * 3) : d.position.y,
            z: d.status === DroneStatus.FLYING ? d.position.z + (Math.random() - 0.5) * 5 : d.position.z,
          }
        }));

        const collisions = new Set<string>();
        for (let i = 0; i < nextDrones.length; i++) {
          const d1 = nextDrones[i];
          if (d1.status !== DroneStatus.FLYING) continue;
          for (let j = i + 1; j < nextDrones.length; j++) {
            const d2 = nextDrones[j];
            if (d2.status !== DroneStatus.FLYING) continue;
            const dx = d1.position.x - d2.position.x;
            const dy = d1.position.y - d2.position.y;
            const dz = d1.position.z - d2.position.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance < COLLISION_THRESHOLD) {
              collisions.add(d1.id);
              collisions.add(d2.id);
            }
          }
        }
        setCollidingDroneIds(collisions);
        return nextDrones;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Find the title for the currently highlighted landmark
  const currentHighlightedLandmarkTitle = useMemo(() => {
    if (!highlightedBuildingId) return undefined;
    const entry = Object.entries(landmarkMappings).find(([_, bId]) => bId === highlightedBuildingId);
    if (!entry) return undefined;
    return localLandmarks[parseInt(entry[0])]?.maps?.title;
  }, [highlightedBuildingId, landmarkMappings, localLandmarks]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full min-h-[720px] bg-[#020617] rounded-[3rem] overflow-hidden border border-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.9)] cursor-crosshair"
    >
      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none"></div>
      
      {/* Fleet & Location Panel */}
      <div className={`absolute top-0 left-0 h-full w-80 bg-slate-950/95 border-r border-slate-800 z-[60] backdrop-blur-3xl transition-transform duration-500 ${showManifest ? 'translate-x-0' : '-translate-x-full'} shadow-2xl flex flex-col`}>
        <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Radar size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Tactical Scan</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Infrastructure Grounding</p>
            </div>
          </div>
          <button onClick={() => setShowManifest(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Discovered Assets</h4>
            {localLandmarks.length > 0 ? (
                localLandmarks.map((chunk, idx) => {
                    const mappedBuildingId = landmarkMappings[idx];
                    const isTarget = highlightedBuildingId === mappedBuildingId;
                    
                    return (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-2xl border transition-all group cursor-pointer
                            ${isTarget ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/50'}`}
                          onClick={() => {
                            if (mappedBuildingId) {
                                setHighlightedBuildingId(mappedBuildingId);
                                const b = cityMap.find(building => building.id === mappedBuildingId);
                                if (b) {
                                    // Smoothly pivot camera towards the landmark
                                    setRotation({ x: 75, z: -Math.atan2(b.x, b.z) * (180 / Math.PI) });
                                }
                            }
                          }}
                        >
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-[11px] font-black text-white uppercase tracking-wider truncate mr-2">{chunk.maps?.title || "Unknown Terminal"}</span>
                               <ExternalLink size={12} className={isTarget ? 'text-emerald-400' : 'text-slate-600 group-hover:text-emerald-400'} />
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium mb-3 line-clamp-2">Real-world sector node detected via orbital scan.</p>
                            <div className="flex items-center justify-between">
                                {chunk.maps?.uri && (
                                    <a href={chunk.maps.uri} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest hover:underline flex items-center gap-1">
                                        Open Intel <ExternalLink size={10} />
                                    </a>
                                )}
                                {isTarget && <div className="text-[8px] font-black text-emerald-400 animate-pulse tracking-widest">POSITION LOCKED</div>}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="p-10 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center">
                    <MapPin size={32} className="text-slate-700 mb-4" />
                    <p className="text-xs font-bold text-slate-600 uppercase mb-4">No Sector Data Sync</p>
                    <button onClick={handleScanLocation} className="px-5 py-2.5 bg-sky-600/10 border border-sky-500/20 text-[10px] font-black text-sky-400 uppercase tracking-widest rounded-xl hover:bg-sky-500/20 transition-all active:scale-95 shadow-lg">Synchronize Local Sector</button>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Control Overlays */}
      <div className="absolute top-8 left-8 flex gap-4 z-[70]">
        <button 
          onClick={() => setShowManifest(!showManifest)}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all active:scale-95
            ${showManifest ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.5)]' : 'glass border-white/10 hover:bg-slate-700/50 text-slate-200'}`}
        >
          <Radar size={22} className={showManifest ? 'animate-pulse' : ''} />
          <span className="text-xs font-black uppercase tracking-[0.3em]">Sector Manifest</span>
        </button>

        <button 
          onClick={handleScanLocation}
          disabled={isScanning}
          className={`flex items-center gap-3 px-6 py-4 glass rounded-2xl border border-white/10 hover:bg-sky-500/20 hover:border-sky-500 transition-all group active:scale-95 disabled:opacity-50 shadow-2xl`}
        >
          {isScanning ? <RefreshCcw size={22} className="text-sky-400 animate-spin" /> : <MapPin size={22} className="text-sky-400 group-hover:scale-125 transition-transform" />}
          <span className="text-xs font-black uppercase tracking-[0.3em]">{isScanning ? 'SYNCING...' : 'LIVE LOCATION SCAN'}</span>
        </button>
      </div>

      <div className="absolute top-8 right-8 flex gap-4 z-[70]">
        <button onClick={() => setIsPaused(!isPaused)} className="p-4 glass rounded-2xl border-white/10 text-slate-200 hover:bg-slate-800 transition-all active:scale-90 shadow-2xl">
          {isPaused ? <Play size={22} className="text-emerald-400" /> : <Pause size={22} className="text-amber-400" />}
        </button>
        <button onClick={() => {
            setRotation({ x: 62, z: 45 });
            setHighlightedBuildingId(null);
        }} className="p-4 glass rounded-2xl border-white/10 text-slate-200 hover:bg-slate-800 transition-all active:scale-90 shadow-2xl">
          <RotateCcw size={22} />
        </button>
      </div>

      {/* Main 3D Tactical Interface */}
      <div className="w-full h-full flex items-center justify-center overflow-visible" style={{ perspective: '2500px' }}>
        <div 
          className="relative w-[800px] h-[800px] transition-transform duration-1000 cubic-bezier(0.2, 0.8, 0.2, 1)"
          style={{ 
            transform: `rotateX(${rotation.x}deg) rotateZ(${rotation.z}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Tactical Ground Grid */}
          <div className="absolute inset-[-250px] bg-[#020617]/90 rounded-full border border-sky-500/10 shadow-[inset_0_0_150px_rgba(14,165,233,0.15)]">
             <div className="absolute inset-0 cyber-grid opacity-30" />
          </div>

          {/* Live Operator Presence Marker (YOUR POSITION) */}
          {userLocationSet && (
            <div 
              className="absolute transition-all duration-1000"
              style={{ 
                left: `400px`, 
                top: `400px`,
                transform: `translateZ(10px)`,
                transformStyle: 'preserve-3d',
                zIndex: 5000
              }}
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 bg-sky-500/10 rounded-full animate-[ping_3s_infinite]" />
                  <div className="absolute inset-2 bg-sky-500/30 rounded-full animate-pulse" />
                  <div className="absolute inset-4 border border-sky-400/50 rounded-full animate-[spin_5s_linear_infinite]" />
                  
                  <div className="relative w-5 h-5 bg-sky-500 border-2 border-white rounded-full shadow-[0_0_30px_#0ea5e9] flex items-center justify-center">
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-sky-600 text-[9px] font-black text-white px-3 py-1.5 rounded-lg border border-sky-400 shadow-[0_10px_30px_rgba(0,0,0,0.8)]" 
                           style={{ transform: `rotateZ(-${rotation.z}deg) rotateX(-${rotation.x}deg)` }}>
                          <span className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                             LIVE OPERATOR (YOU)
                          </span>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {/* City Architecture */}
          <div style={{ transformStyle: 'preserve-3d' }}>
            {cityMap.map(b => (
              <Building3D 
                key={b.id} 
                b={b} 
                onHover={setHoveredBuilding} 
                isHighlighted={highlightedBuildingId === b.id}
                landmarkTitle={highlightedBuildingId === b.id ? currentHighlightedLandmarkTitle : undefined}
              />
            ))}
          </div>

          {/* Tactical Drone Assets */}
          <div style={{ transformStyle: 'preserve-3d' }}>
            {simulatedDrones.map(drone => {
              const isColliding = collidingDroneIds.has(drone.id);
              const isSelected = selectedDroneId === drone.id;
              
              return (
                <div 
                  key={drone.id}
                  className="absolute transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedDroneId(isSelected ? null : drone.id)}
                  style={{ 
                    left: `${400 + drone.position.x}px`, 
                    top: `${400 + drone.position.z}px`,
                    transform: `translateZ(${drone.position.y}px)`,
                    transformStyle: 'preserve-3d',
                    zIndex: isSelected ? 3000 : 100
                  }}
                >
                  <div className={`relative w-6 h-6 rounded-full transition-all duration-300 border-2
                    ${isColliding ? 'bg-rose-500 border-rose-200 animate-ping scale-150' : 
                      isSelected ? 'bg-white border-white shadow-[0_0_60px_#fff] scale-125' : 
                      'bg-sky-500 border-sky-300 shadow-[0_0_40px_rgba(14,165,233,0.7)]'}`}>
                    
                    {isSelected && (
                      <div 
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 scale-150"
                        style={{ transform: `translateX(-50%) rotateZ(-${rotation.z}deg) rotateX(-${rotation.x}deg)` }}
                      >
                         <div className="glass border-2 border-white/20 p-6 rounded-[2rem] shadow-2xl min-w-[220px]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-white uppercase tracking-widest">{drone.name}</span>
                                <div className="px-2 py-0.5 rounded bg-sky-500 text-[8px] font-black text-white uppercase">{drone.status}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-slate-500 uppercase">Energy</span>
                                  <span className="text-sm font-mono font-black text-white">{Math.round(drone.battery)}%</span>
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-slate-500 uppercase">Altitude</span>
                                  <span className="text-sm font-mono font-black text-white">{Math.round(drone.position.y)}m</span>
                               </div>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Uplink Synchronization HUD */}
      {isScanning && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center bg-slate-950/40 backdrop-blur-[6px] animate-in fade-in duration-500">
            <div className="w-[500px] h-[500px] border border-sky-500/20 rounded-full animate-[ping_2s_infinite]"></div>
            <div className="absolute w-[250px] h-[250px] border border-sky-400/40 rounded-full animate-[ping_3s_infinite]"></div>
            <div className="absolute glass px-12 py-8 rounded-[2.5rem] border-sky-500/40 shadow-[0_0_80px_rgba(14,165,233,0.4)] flex flex-col items-center gap-6">
                <div className="relative">
                   <Radar className="text-sky-400 animate-spin" size={48} />
                   <div className="absolute inset-0 border-2 border-sky-400/20 rounded-full scale-150 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <span className="text-lg font-black uppercase tracking-[0.4em] text-white block">Establishing Uplink</span>
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest animate-pulse">Syncing Google Maps Grounding Layer</span>
                    <div className="flex gap-1 justify-center mt-4">
                       {[0, 1, 2, 3].map(i => (
                         <div key={i} className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                       ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AirspaceView;