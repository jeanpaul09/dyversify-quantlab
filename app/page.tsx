"use client";

import { useState, useEffect } from 'react';
import { useAuth } from 'A/lib/hooks/useAuth';
import { backtests } from '../lib/data';
import { MetricsPanel } from '../components/neural/MetricsPanel';
import { BacktestTable } from '../components/neural/BacktestTable';
import EquityChart from '../components/neural/EquityChart';
import clsx from 'clsx';
import { Metrics } from '../lib/types';

// Icons
import { 
  SquareActivity, 
  Terminal, 
  Settings, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Wifi,
  Cpu,
  Zap,
  Lock,
  Search
} from 'lucide-react';

const ZONES = [
  { id: 'dashboard', label: 'DASHBOARD' },
  { id: 'strategies', label: 'STRATEGIES' },
  { id: 'analysis', label: 'ANALYSIS' },
  { id: 'optimize', label: 'OPTIMIZE' },
  { id: 'settings', label: 'SETTINGS' },
];

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [activeZone, setActiveZone] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<string>(backtests[0].id);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Show loading while checking auth
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[var(--void)]">
        <div className="w-5 h-5 border border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const selectedBacktest = backtests.find(b => b.id === selectedId) || backtests[0];

  // Calculate portfolio aggregate metrics
  const portfolioMetrics: Metrics = {
    totalPnL: backtests.reduce((acc, b) => acc + b.metrics.totalPnL, 0),
    winRate: backtests.reduce((acc, b) => acc + b.metrics.winRate, 0) / backtests.length,
    profitFactor: backtests.reduce((acc, b) => acc + b.metrics.profitFactor, 0) / backtests.length,
    sharpeRatio: backtests.reduce((acc, b) => acc + b.metrics.sharpeRatio, 0) / backtests.length,
    maxDrawdown: Math.min(...backtests.map(b => b.metrics.maxDrawdown)),
    trades: backtests.reduce((acc, b) => acc + b.metrics.trades, 0)
  };

  return (
    <div className="flex flex-col h-screen w-full font-mono text-xs overflow-hidden bg-[var(--void)] text-[var(--text-1)] relative z-10">

      {/* ═══ TOP NAV BAR ═══ */}
      <header className="flex items-center justify-between px-4 h-[40px] min-h-[40px] bg-[var(--graphite-900)] border-b border-[var(--graphite-400)] z-20">
        
        {/* Branding */}
        <div className="flex items-center gap-3 w-[200px]">
          <div className="relative w-4 h-4">
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_var(--neon-glow)]">
              <polygon points="50,10 90,90 10,90" fill="none" stroke="var(--neon)" strokeWidth="8"/>
              <polygon points="50,35 70,75 30,75" fill="var(--neon)"/>
            </svg>
          </div>
          <span className="font-bold tracking-[0.15em] text-[var(--neon)] text-shadow-neon">
            DIVERSIFY
          </span>
        </div>

        {/* Zone Tabs */}
        <nav className="flex items-center h-full">
          {ZONES.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setActiveZone(zone.id)}
              className={clsx(
                "h-[28px] px-4 mx-[1px] flex items-center gap-2 border text-[10px] font-medium tracking-widest transition-all duration-150 uppercase outline-none",
                activeZone === zone.id 
                  ? "bg-[var(--neon)] text-[var(--void)] border-[var(--neon)] shadow-[0_0_10px_var(--neon-glow)]" 
                  : "bg-transparent text-[var(--text-3)] border-transparent hover:text-[var(--text-1)] hover:bg-[var(--graphite-800)] hover:border-[var(--graphite-400)]"
              )}
            >
              <span className="opacity-50 text-[8px]">{ZONES.indexOf(zone) + 1}</span>
              {zone.label}
            </button>
          ))}
        </nav>

        {/* Right Status */}
        <div className="flex items-center gap-4 w-[200px] justify-end">
          <div className="flex items-center gap-2 px-3 py-1 border border-[var(--graphite-400)] bg-[var(--graphite-800)]">
             <Lock size={10} className="text-[var(--text-3)]" />
             <span className="text-[var(--text-2)] text-[10px] tracking-wider">CONNECTED</span>
          </div>
        </div>
      </header>
