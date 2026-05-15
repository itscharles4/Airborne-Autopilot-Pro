import React, { useState, useEffect, useRef } from 'react';
import { Drone } from '../types';
import { MapPin, RefreshCcw, Play, Pause, Radar, Target, Signal, Zap, Activity } from 'lucide-react';

interface AirspaceViewProps {
  drones: Drone[];
}

interface SelectedDroneInfo {
  drone: Drone;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  heading: number;
}

// Google Maps type augmentation
declare global {
  interface Window {
    google: any;
  }
}

const AirspaceView: React.FC<AirspaceViewProps> = ({ drones }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState<SelectedDroneInfo | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dronesToDisplay, setDronesToDisplay] = useState<(Drone & { lat: number; lng: number })[]>([]);

  // Initialize Google Map and auto-scan location
  useEffect(() => {
    const initMap = () => {
      if (!mapContainerRef.current) return;

      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError('Google Maps API key not configured');
          return;
        }

        // Load Google Maps script
        if (window.google && window.google.maps) {
          createMap();
          autoScanLocation();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;

        script.onload = () => {
          createMap();
          autoScanLocation();
        };

        script.onerror = () => {
          setError('Failed to load Google Maps. Check your API key.');
        };

        document.head.appendChild(script);
      } catch (err) {
        setError('Error initializing map: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };

    const createMap = () => {
      if (!mapContainerRef.current) return;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        zoom: 13,
        center: { lat: 40.7128, lng: -74.006 },
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8899aa' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1622' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3a5c' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a3a52' }] },
          { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1a3a52' }] },
        ],
      });

      mapRef.current = map;
    };

    initMap();
  }, []);

  // Auto-scan location on mount
  const autoScanLocation = () => {
    if (isScanning) return;
    setIsScanning(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setUserLocation(location);

        if (mapRef.current) {
          mapRef.current.setCenter(location);
          mapRef.current.setZoom(14);

          // Add marker for user location
          new window.google.maps.Marker({
            position: location,
            map: mapRef.current,
            title: 'Your Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          });
        }

        // Generate drone positions near user location
        generateDronesNearLocation(location);
        setIsScanning(false);
      },
      (err) => {
        setError('Location access denied. Please enable location services.');
        setIsScanning(false);
        // Fallback to NYC for demo
        const fallbackLocation = { lat: 40.7128, lng: -74.006 };
        setUserLocation(fallbackLocation);
        generateDronesNearLocation(fallbackLocation);
      }
    );
  };

  // Generate drone positions near user location
  const generateDronesNearLocation = (center: { lat: number; lng: number }) => {
    const dronesWithLocation = drones.map((drone, index) => {
      // Spread drones in a 2km radius around the user location
      const angle = (index / drones.length) * Math.PI * 2; // Distribute around circle
      const radius = 0.01 + (Math.random() * 0.01); // 1-2 km radius (approx 0.01-0.02 degrees)
      
      const lat = center.lat + radius * Math.cos(angle);
      const lng = center.lng + radius * Math.sin(angle);

      return {
        ...drone,
        lat,
        lng,
      };
    });

    setDronesToDisplay(dronesWithLocation);
    if (mapRef.current) {
      addDroneMarkers(mapRef.current, dronesWithLocation);
    }
  };

  // Update drone markers
  useEffect(() => {
    if (!mapRef.current || dronesToDisplay.length === 0) return;
    
    // Clear previous markers
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for all drones
    if (!isPaused) {
      addDroneMarkers(mapRef.current, dronesToDisplay);
    }
  }, [dronesToDisplay, isPaused]);

  // Add drone markers to map
  const addDroneMarkers = (map: any, dronesWithLoc: (Drone & { lat: number; lng: number })[]) => {
    if (!window.google || !window.google.maps) return;

    dronesWithLoc.forEach((drone) => {
      // Determine marker color based on status
      let markerColor = 'blue'; // IDLE
      if (drone.status === 'FLYING') markerColor = 'green';
      if (drone.status === 'EMERGENCY') markerColor = 'red';

      const marker = new window.google.maps.Marker({
        position: { lat: drone.lat, lng: drone.lng },
        map,
        title: drone.name,
        icon: `http://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
      });

      // Add click listener to show drone info
      marker.addListener('click', () => {
        const droneInfo: SelectedDroneInfo = {
          drone,
          lat: drone.lat,
          lng: drone.lng,
          altitude: Math.abs(drone.position.z),
          speed: drone.speed,
          heading: Math.random() * 360, // Simulated heading
        };
        setSelectedDrone(droneInfo);

        // Center map on drone
        map.setCenter({ lat: drone.lat, lng: drone.lng });
        map.setZoom(15);
      });

      markersRef.current.push(marker);
    });
  };

  const handleScanLocation = () => {
    if (isScanning) return;
    setIsScanning(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setUserLocation(location);

        if (mapRef.current) {
          mapRef.current.setCenter(location);
          mapRef.current.setZoom(14);

          // Clear previous markers and re-add user location
          markersRef.current.forEach((marker: any) => marker.setMap(null));
          markersRef.current = [];

          new window.google.maps.Marker({
            position: location,
            map: mapRef.current,
            title: 'Your Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          });

          // Regenerate drone positions near the new location
          generateDronesNearLocation(location);
        }

        setIsScanning(false);
      },
      (err) => {
        setError('Location access denied. Please enable location services.');
        setIsScanning(false);
      }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[720px] bg-[#020617] rounded-[3rem] overflow-hidden border border-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.9)]">
      {/* Google Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-[3rem]"
        style={{ minHeight: '720px' }}
      />

      {/* Drones List Indicator */}
      <div className="absolute bottom-8 left-8 z-[70] glass rounded-2xl border border-white/10 p-6 max-w-xs shadow-2xl">
        <h3 className="text-sm font-bold text-sky-400 mb-4 flex items-center gap-2">
          <Target size={16} />
          ACTIVE DRONES ({dronesToDisplay.length})
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {dronesToDisplay.map((drone) => (
            <button
              key={drone.id}
              onClick={() => {
                const droneInfo: SelectedDroneInfo = {
                  drone,
                  lat: drone.lat,
                  lng: drone.lng,
                  altitude: Math.abs(drone.position.z),
                  speed: drone.speed,
                  heading: Math.random() * 360,
                };
                setSelectedDrone(droneInfo);
                if (mapRef.current) {
                  mapRef.current.setCenter({ lat: drone.lat, lng: drone.lng });
                  mapRef.current.setZoom(15);
                }
              }}
              className={`w-full p-3 rounded-lg text-left text-xs font-semibold transition-all ${
                selectedDrone?.drone.id === drone.id
                  ? 'bg-sky-600 text-white border border-sky-500'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    drone.status === 'FLYING'
                      ? 'bg-emerald-400'
                      : drone.status === 'IDLE'
                      ? 'bg-blue-400'
                      : 'bg-red-400'
                  }`}
                />
                <span>{drone.name}</span>
              </div>
              <span className="text-[10px] text-slate-400">Battery: {drone.battery.toFixed(1)}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location Scan Button */}
      <div className="absolute top-8 left-8 z-[70]">
        <button
          onClick={handleScanLocation}
          disabled={isScanning}
          className="flex items-center gap-3 px-6 py-4 glass rounded-2xl border border-white/10 hover:bg-sky-500/20 hover:border-sky-500 transition-all group active:scale-95 disabled:opacity-50 shadow-2xl"
        >
          {isScanning ? (
            <RefreshCcw size={22} className="text-sky-400 animate-spin" />
          ) : (
            <MapPin size={22} className="text-sky-400 group-hover:scale-125 transition-transform" />
          )}
          <span className="text-xs font-black uppercase tracking-[0.2em]">
            {isScanning ? 'Rescanning...' : userLocation ? 'Rescan Location' : 'Live Location Scan'}
          </span>
        </button>
      </div>

      {/* Playback Controls */}
      <div className="absolute top-8 right-8 z-[70]">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-4 glass rounded-2xl border border-white/10 text-slate-200 hover:bg-slate-700/50 transition-all active:scale-90 shadow-2xl"
        >
          {isPaused ? (
            <Play size={22} className="text-emerald-400" />
          ) : (
            <Pause size={22} className="text-amber-400" />
          )}
        </button>
      </div>

      {/* Selected Drone Info Panel */}
      {selectedDrone && (
        <div className="absolute top-8 right-8 z-[70] mt-20 glass rounded-2xl border border-sky-500/30 p-6 w-80 shadow-2xl bg-slate-900/80 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Target size={20} className="text-sky-400" />
                {selectedDrone.drone.name}
              </h3>
              <button
                onClick={() => setSelectedDrone(null)}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">STATUS</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                      selectedDrone.drone.status === 'FLYING'
                        ? 'bg-emerald-400'
                        : selectedDrone.drone.status === 'IDLE'
                        ? 'bg-blue-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <p className="font-semibold text-white text-sm">{selectedDrone.drone.status}</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">MODEL</p>
                <p className="font-semibold text-white text-sm">{selectedDrone.drone.model}</p>
              </div>
            </div>

            {/* Location Data */}
            <div className="space-y-3 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                <Target size={14} />
                Live Location
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Latitude:</span>
                  <span className="text-white font-mono">{selectedDrone.lat.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitude:</span>
                  <span className="text-white font-mono">{selectedDrone.lng.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance from you:</span>
                  <span className="text-emerald-400 font-semibold">
                    {userLocation 
                      ? `${(Math.sqrt(Math.pow(selectedDrone.lat - userLocation.lat, 2) + Math.pow(selectedDrone.lng - userLocation.lng, 2)) * 111).toFixed(2)} km`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Altitude:</span>
                  <span className="text-emerald-400 font-semibold">{selectedDrone.altitude.toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Heading:</span>
                  <span className="text-sky-400 font-semibold">{selectedDrone.heading.toFixed(1)}°</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-3 bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} />
                Performance
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Battery</span>
                    <span className="text-sm font-bold text-white">{selectedDrone.drone.battery.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selectedDrone.drone.battery > 50
                          ? 'bg-emerald-500'
                          : selectedDrone.drone.battery > 20
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${selectedDrone.drone.battery}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Zap size={12} />
                      Speed
                    </p>
                    <p className="font-bold text-white">{selectedDrone.speed} km/h</p>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Signal size={12} />
                      Signal
                    </p>
                    <p className="font-bold text-emerald-400">95%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Location Info Panel */}
      {userLocation && !selectedDrone && (
        <div className="absolute top-8 right-8 z-[70] glass rounded-2xl border border-blue-500/30 p-6 w-80 shadow-2xl bg-slate-900/80 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
              <MapPin size={20} className="text-blue-400" />
              <h3 className="text-lg font-bold text-white">Your Location</h3>
            </div>
            
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Latitude</span>
                <span className="text-white font-mono text-sm">{userLocation.lat.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Longitude</span>
                <span className="text-white font-mono text-sm">{userLocation.lng.toFixed(6)}°</span>
              </div>
              <div className="text-xs text-slate-400 text-center pt-3 border-t border-slate-700">
                <span className="text-emerald-400 font-semibold">GPS ACQUIRED</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center">
              {dronesToDisplay.length} drones operating in your area
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="absolute bottom-8 right-8 z-[70] bg-rose-500/20 border border-rose-500 text-rose-200 px-6 py-4 rounded-2xl flex items-center gap-3 max-w-md shadow-2xl">
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {/* Scanning Animation Overlay */}
      {isScanning && (
        <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center bg-slate-950/40 backdrop-blur-[6px]">
          <div className="w-[500px] h-[500px] border border-sky-500/20 rounded-full animate-[ping_2s_infinite]" />
          <div className="absolute w-[250px] h-[250px] border border-sky-400/40 rounded-full animate-[ping_3s_infinite]" />
          <div className="absolute glass px-12 py-8 rounded-[2.5rem] border-sky-500/40 shadow-[0_0_80px_rgba(14,165,233,0.4)] flex flex-col items-center gap-6">
            <div className="relative">
              <Radar className="text-sky-400 animate-spin" size={48} />
            </div>
            <div className="text-center space-y-2">
              <span className="text-lg font-black uppercase tracking-[0.4em] text-white block">
                Scanning Location
              </span>
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">
                Getting your position...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AirspaceView;
