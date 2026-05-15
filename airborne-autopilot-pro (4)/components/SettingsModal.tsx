import React, { useState } from 'react';
import { X, Wifi, Bell, Shield, Zap, Palette, Volume2, Moon, Smartphone } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    darkMode: true,
    autoUpdate: true,
    wifi: true,
    lowBatteryAlert: true,
    collisionAvoidance: true,
    telemetryInterval: '2000',
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key]
    }));
  };

  const handleChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center">
              <Zap size={24} className="text-white" />
            </div>
            System Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Connectivity Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Wifi size={16} />
              Connectivity
            </h3>
            
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Wi-Fi Enabled</p>
                  <p className="text-xs text-slate-400">Connect via wireless network</p>
                </div>
                <button
                  onClick={() => handleToggle('wifi')}
                  className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
                    settings.wifi ? 'bg-sky-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                      settings.wifi ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Telemetry Interval</p>
                  <p className="text-xs text-slate-400">Update frequency in milliseconds</p>
                </div>
                <select
                  value={settings.telemetryInterval}
                  onChange={(e) => handleChange('telemetryInterval', e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="1000">1000ms</option>
                  <option value="2000">2000ms (Default)</option>
                  <option value="5000">5000ms</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Bell size={16} />
              Notifications & Audio
            </h3>
            
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Notifications</p>
                  <p className="text-xs text-slate-400">Enable system notifications</p>
                </div>
                <button
                  onClick={() => handleToggle('notifications')}
                  className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
                    settings.notifications ? 'bg-sky-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Sound Alerts</p>
                  <p className="text-xs text-slate-400">Play audio alerts for events</p>
                </div>
                <button
                  onClick={() => handleToggle('soundEnabled')}
                  className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
                    settings.soundEnabled ? 'bg-sky-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Low Battery Alerts</p>
                  <p className="text-xs text-slate-400">Alert when drone battery is low</p>
                </div>
                <button
                  onClick={() => handleToggle('lowBatteryAlert')}
                  className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
                    settings.lowBatteryAlert ? 'bg-sky-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                      settings.lowBatteryAlert ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Safety Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} />
              Safety & Security
            </h3>
            
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Collision Avoidance</p>
                  <p className="text-xs text-slate-400">Enable automatic obstacle detection</p>
                </div>
                <button
                  onClick={() => handleToggle('collisionAvoidance')}
                  className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
                    settings.collisionAvoidance ? 'bg-emerald-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                      settings.collisionAvoidance ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Auto Update</p>
                  <p className="text-xs text-slate-400">Automatically update firmware</p>
                </div>
                <button
                  onClick={() => handleToggle('autoUpdate')}
                  className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
                    settings.autoUpdate ? 'bg-sky-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                      settings.autoUpdate ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Display Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Palette size={16} />
              Display
            </h3>
            
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-200">Dark Mode</p>
                  <p className="text-xs text-slate-400">Use dark theme (currently active)</p>
                </div>
                <button
                  onClick={() => handleToggle('darkMode')}
                  className={`relative inline-flex h-8 w-14 rounded-full transition-colors ${
                    settings.darkMode ? 'bg-slate-600' : 'bg-sky-600'
                  }`}
                >
                  <span
                    className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform ${
                      settings.darkMode ? 'translate-x-0.5' : 'translate-x-6'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* System Info Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Smartphone size={16} />
              System Information
            </h3>
            
            <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Platform Version</span>
                <span className="font-semibold text-emerald-400">v2.1.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">API Server</span>
                <span className="font-semibold text-sky-400">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Database</span>
                <span className="font-semibold text-emerald-400">In-Memory</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Last Update</span>
                <span className="font-semibold text-slate-300">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 bg-slate-800/50 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-sky-600/50"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
