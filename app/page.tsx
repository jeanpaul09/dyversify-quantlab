"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
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

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar (Optional - Context) */}
        <aside className="w-[60px] border-r border-[var(--graphite-400)] bg-[var(--graphite-900)] flex flex-col items-center py-4 gap-4 z-10">
           <div className="w-8 h-8 flex items-center justify-center border border-[var(--graphite-400)] bg-[var(--graphite-800)] text-[var(--text-3)] hover:text-[var(--neon)] hover:border-[var(--neon)] transition-colors cursor-pointer">
             <SquareActivity size={16} />
           </div>
           <div className="w-8 h-8 flex items-center justify-center border border-[var(--graphite-400)] bg-[var(--graphite-800)] text-[var(--text-3)] hover:text-[var(--neon)] hover:border-[var(--neon)] transition-colors cursor-pointer">
             <Terminal size={16} />
           </div>
           <div className="w-8 h-8 flex items-center justify-center border border-[var(--graphite-400)] bg-[var(--graphite-800)] text-[var(--text-3)] hover:text-[var(--neon)] hover:border-[var(--neon)] transition-colors cursor-pointer">
             <BarChart3 size={16} />
           </div>
           <div className="mt-auto w-8 h-8 flex items-center justify-center border border-[var(--graphite-400)] bg-[var(--graphite-800)] text-[var(--text-3)] hover:text-[var(--neon)] hover:border-[var(--neon)] transition-colors cursor-pointer">
             <Settings size={16} />
           </div>
        </aside>

        {/* Zone Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
            {/* Grid Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
                 style={{ backgroundImage: 'linear-gradient(var(--graphite-400) 1px, transparent 1px), linear-gradient(90deg, var(--graphite-400) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
            />

            {activeZone === 'dashboard' && (
              <div className="max-w-[1600px] mx-auto space-y-6 relative z-10">
                {/* Metrics Row */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-4 w-1 bg-[var(--neon)] shadow-[0_0_8px_var(--neon)]"></div>
                    <h2 className="text-sm font-bold tracking-[0.2em] text-[var(--text-1)] uppercase">
                      Global Performance
                    </h2>
                  </div>
                  <MetricsPanel metrics={portfolioMetrics} />
                </div>

                {/* Main Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
                  
                  {/* Left: Chart & Details */}
                  <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                    <div className="flex-1 min-h-0">
                      <EquityChart data={selectedBacktest} />
                    </div>
                    
                    {/* Strategy Detail Panel */}
                    <div className="neural-panel p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-2)] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--neon)] rounded-full animate-pulse"></span>
                          Active Strategy: <span className="text-[var(--text-1)] text-shadow-neon">{selectedBacktest.name}</span>
                        </h3>
                        <div className="flex gap-2">
                          <span className="px-1.5 py-0.5 border border-[var(--graphite-400)] text-[9px] text-[var(--text-3)] uppercase">
                            ID: {selectedBacktest.id}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                         <div>
                            <div className="text-[9px] text-[var(--text-3)] uppercase tracking-widest mb-0.5">Total PnL</div>
                            <div className={clsx("text-lg font-bold tabular-nums tracking-tight", 
                              selectedBacktest.metrics.totalPnL > 0 ? "text-[var(--neon)] text-shadow-neon" : "text-[var(--crimson)]"
                            )}>
                              ${selectedBacktest.metrics.totalPnL.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-[var(--text-3)] uppercase tracking-widest mb-0.5">Win Rate</div>
                            <div className="text-lg font-bold tabular-nums text-[var(--text-1)]">
                              {(selectedBacktest.metrics.winRate * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-[var(--text-3)] uppercase tracking-widest mb-0.5">Profit Factor</div>
                            <div className="text-lg font-bold tabular-nums text-[var(--text-1)]">
                              {selectedBacktest.metrics.profitFactor.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-[var(--text-3)] uppercase tracking-widest mb-0.5">Max DD</div>
                            <div className="text-lg font-bold tabular-nums text-[var(--crimson)]">
                              {selectedBacktest.metrics.maxDrawdown}%
                            </div>
                          </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: List */}
                  <div className="lg:col-span-4 h-full flex flex-col min-h-0">
                    <BacktestTable 
                      backtests={backtests} 
                      selectedId={selectedId} 
                      onSelect={setSelectedId} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeZone !== 'dashboard' && (
               <div className="flex flex-col items-center justify-center h-full text-[var(--text-3)] space-y-4">
                  <div className="w-12 h-12 border border-[var(--text-3)] flex items-center justify-center rounded-sm">
                    <div className="w-2 h-2 bg-[var(--text-3)] animate-pulse"></div>
                  </div>
                  <span className="tracking-[0.2em] text-xs uppercase">Module Offline</span>
               </div>
            )}

        </div>
      </main>

      {/* ═══ BOTTOM STATUS BAR ═══ */}
      <footer className="h-[24px] min-h-[24px] bg-[var(--graphite-900)] border-t border-[var(--graphite-400)] flex items-center justify-between px-4 text-[9px] text-[var(--text-3)] uppercase tracking-wider z-20">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-[var(--neon)] rounded-full animate-pulse shadow-[0_0_4px_var(--neon)]"></span>
               <span className="text-[var(--text-2)]">System Online</span>
            </span>
            <span>
               CPU <span className="text-[var(--text-2)]">12%</span>
            </span>
            <span>
               MEM <span className="text-[var(--text-2)]">2.4GB</span>
            </span>
         </div>

         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
               <Wifi size={10} />
               <span className="text-[var(--neon)]">3ms</span>
            </span>
            <span>v1.0.4-beta</span>
            <span className="tabular-nums text-[var(--text-2)]">
               {currentTime?.toLocaleTimeString()}
            </span>
         </div>
      </footer>

    </div>
  
 "�
}
