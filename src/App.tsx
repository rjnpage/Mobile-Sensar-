/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  Compass, 
  Zap, 
  MapPin, 
  Camera, 
  Mic, 
  Wifi, 
  Info, 
  Home, 
  Cpu, 
  Thermometer, 
  Droplets, 
  Sun, 
  ArrowRight,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Download,
  Share2,
  Settings,
  History,
  LayoutDashboard,
  Gauge
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

type SensorData = {
  timestamp: number;
  x?: number;
  y?: number;
  z?: number;
  value?: number;
};

type Tab = 'home' | 'sensors' | 'tools' | 'info';

// --- Components ---

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={onClick ? { scale: 1.02 } : undefined}
    whileTap={onClick ? { scale: 0.98 } : undefined}
    onClick={onClick}
    className={cn(
      "bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800",
      onClick && "cursor-pointer",
      className
    )}
  >
    {children}
  </motion.div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Global State for Sensors
  const [accelData, setAccelData] = useState<SensorData[]>([]);
  const [gyroData, setGyroData] = useState<SensorData[]>([]);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number; speed: number | null; altitude: number | null } | null>(null);
  const [battery, setBattery] = useState<{ level: number; charging: boolean; chargingTime: number; dischargingTime: number } | null>(null);
  const [network, setNetwork] = useState<{ type: string; effectiveType: string; downlink: number; rtt: number } | null>(null);
  const [isSensorSupported, setIsSensorSupported] = useState({
    motion: 'ondevicemotion' in window,
    orientation: 'ondeviceorientation' in window,
    geolocation: 'geolocation' in navigator,
    battery: 'getBattery' in navigator,
    network: 'connection' in navigator,
  });

  // --- Sensor Listeners ---

  useEffect(() => {
    // Motion Sensor
    const handleMotion = (event: DeviceMotionEvent) => {
      const { accelerationIncludingGravity } = event;
      if (accelerationIncludingGravity) {
        setAccelData(prev => [
          ...prev.slice(-49),
          { 
            timestamp: Date.now(), 
            x: accelerationIncludingGravity.x || 0, 
            y: accelerationIncludingGravity.y || 0, 
            z: accelerationIncludingGravity.z || 0 
          }
        ]);
      }
    };

    // Orientation Sensor
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      });
    };

    if (isSensorSupported.motion) {
      window.addEventListener('devicemotion', handleMotion);
    }
    if (isSensorSupported.orientation) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    // Geolocation
    let geoWatchId: number;
    if (isSensorSupported.geolocation) {
      geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            altitude: pos.coords.altitude
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }

    // Battery
    if (isSensorSupported.battery) {
      (navigator as any).getBattery().then((batt: any) => {
        const updateBattery = () => {
          setBattery({
            level: batt.level * 100,
            charging: batt.charging,
            chargingTime: batt.chargingTime,
            dischargingTime: batt.dischargingTime
          });
        };
        updateBattery();
        batt.addEventListener('levelchange', updateBattery);
        batt.addEventListener('chargingchange', updateBattery);
      });
    }

    // Network
    if (isSensorSupported.network) {
      const conn = (navigator as any).connection;
      const updateNetwork = () => {
        setNetwork({
          type: conn.type || 'unknown',
          effectiveType: conn.effectiveType || 'unknown',
          downlink: conn.downlink || 0,
          rtt: conn.rtt || 0
        });
      };
      updateNetwork();
      conn.addEventListener('change', updateNetwork);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
      if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
    };
  }, [isSensorSupported]);

  // --- UI Views ---

  const renderHome = () => (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Device health at a glance</p>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
        >
          {isDarkMode ? <Sun size={20} /> : <Activity size={20} />}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="col-span-full md:col-span-1 bg-indigo-600 text-white border-none">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <Zap size={24} />
            </div>
            <Badge variant="success">Healthy</Badge>
          </div>
          <h3 className="text-lg font-semibold opacity-80">Battery Status</h3>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-bold">{battery?.level.toFixed(0) || '--'}%</span>
            <span className="mb-1 opacity-70">{battery?.charging ? 'Charging' : 'Discharging'}</span>
          </div>
          <div className="mt-4 w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${battery?.level || 0}%` }}
              className="h-full bg-white"
            />
          </div>
        </Card>

        <Card onClick={() => setActiveTab('sensors')}>
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Activity size={24} />
            </div>
            <ChevronRight className="text-zinc-300" />
          </div>
          <h3 className="text-zinc-900 dark:text-white font-semibold">Motion Sensors</h3>
          <p className="text-sm text-zinc-500 mt-1">Accelerometer & Gyroscope active</p>
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accelData.slice(-20)}>
                <Area type="monotone" dataKey="x" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card onClick={() => setActiveTab('tools')}>
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <MapPin size={24} />
            </div>
            <ChevronRight className="text-zinc-300" />
          </div>
          <h3 className="text-zinc-900 dark:text-white font-semibold">Location</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Detecting location...'}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Accuracy: {location?.accuracy.toFixed(1) || '--'}m
          </div>
        </Card>
      </div>

      <section>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Quick Tests</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Camera, label: 'Camera', color: 'bg-rose-100 text-rose-600' },
            { icon: Mic, label: 'Microphone', color: 'bg-purple-100 text-purple-600' },
            { icon: Wifi, label: 'Network', color: 'bg-cyan-100 text-cyan-600' },
            { icon: Compass, label: 'Compass', color: 'bg-orange-100 text-orange-600' },
          ].map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              <div className={cn("p-3 rounded-2xl mb-3", item.color)}>
                <item.icon size={24} />
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );

  const renderSensors = () => (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Sensors</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Real-time hardware diagnostics</p>
      </header>

      <div className="space-y-4">
        {/* Accelerometer */}
        <Card className="overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white">Accelerometer</h3>
                <p className="text-xs text-zinc-500">Linear acceleration (m/s²)</p>
              </div>
            </div>
            <Badge variant={isSensorSupported.motion ? 'success' : 'error'}>
              {isSensorSupported.motion ? 'Active' : 'Not Supported'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {['X', 'Y', 'Z'].map((axis) => (
              <div key={axis} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-center">
                <span className="text-xs font-bold text-zinc-400 block mb-1">{axis}-Axis</span>
                <span className="text-xl font-mono font-bold text-zinc-900 dark:text-white">
                  {accelData[accelData.length - 1]?.[axis.toLowerCase() as 'x' | 'y' | 'z']?.toFixed(2) || '0.00'}
                </span>
              </div>
            ))}
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accelData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={[-15, 15]} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ display: 'none' }}
                />
                <Line type="monotone" dataKey="x" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="z" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Orientation */}
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl">
                <Compass size={20} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white">Orientation</h3>
                <p className="text-xs text-zinc-500">Device rotation (degrees)</p>
              </div>
            </div>
            <Badge variant={isSensorSupported.orientation ? 'success' : 'error'}>
              {isSensorSupported.orientation ? 'Active' : 'Not Supported'}
            </Badge>
          </div>

          <div className="flex items-center justify-center py-8">
            <div className="relative w-48 h-48 rounded-full border-4 border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: orientation.alpha }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-1 h-24 bg-orange-500 rounded-full origin-bottom -translate-y-12" />
              </motion.div>
              <div className="text-center z-10">
                <span className="text-3xl font-bold text-zinc-900 dark:text-white">{Math.round(orientation.alpha)}°</span>
                <span className="block text-xs font-bold text-zinc-400 uppercase tracking-widest">Alpha</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
              <span className="text-xs font-bold text-zinc-400 block mb-1">Beta (Tilt)</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">{Math.round(orientation.beta)}°</span>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
              <span className="text-xs font-bold text-zinc-400 block mb-1">Gamma (Roll)</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">{Math.round(orientation.gamma)}°</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Tools</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Advanced diagnostic utilities</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex flex-col items-center text-center py-10">
          <div className="p-4 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl mb-4">
            <Camera size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Camera Test</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-[200px]">Check resolution, flash, and sensor quality</p>
          <button className="mt-6 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm">
            Launch Camera
          </button>
        </Card>

        <Card className="flex flex-col items-center text-center py-10">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-3xl mb-4">
            <Mic size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Acoustic Test</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-[200px]">Measure decibels and frequency response</p>
          <button className="mt-6 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm">
            Start Recording
          </button>
        </Card>

        <Card className="flex flex-col items-center text-center py-10">
          <div className="p-4 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-3xl mb-4">
            <Wifi size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Speed Test</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-[200px]">Analyze network latency and throughput</p>
          <div className="mt-6 flex items-center gap-4">
             <div className="text-center">
               <span className="block text-2xl font-bold text-zinc-900 dark:text-white">{network?.downlink || '0'}</span>
               <span className="text-[10px] font-bold text-zinc-400 uppercase">Mbps</span>
             </div>
             <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
             <div className="text-center">
               <span className="block text-2xl font-bold text-zinc-900 dark:text-white">{network?.rtt || '0'}</span>
               <span className="text-[10px] font-bold text-zinc-400 uppercase">ms</span>
             </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center text-center py-10">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl mb-4">
            <Download size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Export Data</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-[200px]">Save sensor logs to CSV or JSON format</p>
          <button className="mt-6 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm">
            Generate Report
          </button>
        </Card>
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Device Info</h1>
        <p className="text-zinc-500 dark:text-zinc-400">System specifications</p>
      </header>

      <div className="space-y-4">
        <Card>
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Cpu size={18} className="text-indigo-500" /> Hardware
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Platform', value: navigator.platform },
              { label: 'CPU Cores', value: navigator.hardwareConcurrency },
              { label: 'Memory', value: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Unknown' },
              { label: 'User Agent', value: 'Mobile Browser', sub: navigator.userAgent.split(' ')[0] },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                <span className="text-sm text-zinc-500">{item.label}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.value}</span>
                  {item.sub && <p className="text-[10px] text-zinc-400">{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <LayoutDashboard size={18} className="text-emerald-500" /> Display
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Resolution', value: `${window.screen.width} x ${window.screen.height}` },
              { label: 'Color Depth', value: `${window.screen.colorDepth} bit` },
              { label: 'Pixel Ratio', value: window.devicePixelRatio },
              { label: 'Orientation', value: window.screen.orientation.type },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                <span className="text-sm text-zinc-500">{item.label}</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="p-6 text-center">
          <p className="text-xs text-zinc-400">Smart Sensor Tester Pro v1.0.0</p>
          <p className="text-[10px] text-zinc-300 mt-1">Built with React & Tailwind CSS</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isDarkMode ? "dark bg-black" : "bg-zinc-50")}>
      <div className="max-w-md mx-auto min-h-screen flex flex-col pb-24">
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'home' && renderHome()}
              {activeTab === 'sensors' && renderSensors()}
              {activeTab === 'tools' && renderTools()}
              {activeTab === 'info' && renderInfo()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 px-6 py-3 flex justify-between items-center z-50">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'sensors', icon: Activity, label: 'Sensors' },
            { id: 'tools', icon: Gauge, label: 'Tools' },
            { id: 'info', icon: Info, label: 'Info' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                activeTab === item.id 
                  ? "text-indigo-600 dark:text-indigo-400 scale-110" 
                  : "text-zinc-400 dark:text-zinc-600"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-colors",
                activeTab === item.id && "bg-indigo-50 dark:bg-indigo-900/20"
              )}>
                <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
