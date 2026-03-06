'use client';

import { useState } from 'react';
import { ShieldCheck, Play, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';

// Mock Monte Carlo equity cone data
const MC_STEPS = 200;
const MOCK_MC_CONE = Array.from({ length: MC_STEPS }, (_, i) => {
  const base = 10000;
  const step = i / MC_STEPS;
  const trend = step * 5000;
  const spread = step * 2000;
  return {
    trade: i + 1,
    P5: base + trend - spread * 2.2 + Math.sin(i * 0.1) * 200,
    P10: base + trend - spread * 1.8 + Math.sin(i * 0.1) * 150,
    P25: base + trend - spread * 1.0 + Math.sin(i * 0.1) * 100,
    P50: base + trend + Math.sin(i * 0.15) * 100,
    P75: base + trend + spread * 1.0 + Math.sin(i * 0.1) * 100,
    P90: base + trend + spread * 1.8 + Math.sin(i * 0.1) * 150,
    P95: base + trend + spread * 2.2 + Math.sin(i * 0.1) * 200,
  };
});

// Mock drawdown distribution
const MOCK_DD_DIST = Array.from({ length: 30 }, (_, i) => {
  const dd = -(i + 1);
  const freq = Math.exp(-(Math.pow(i - 8, 2)) / 40) * 100;
  return { drawdown: `${dd}%`, frequency: Math.max(Math.round(freq), 1) };
});

function RobustnessGauge({ score, verdict }: { score: number; verdict: string }) {
  const color = verdict === 'ROBUST' ? 'var(--neon)' : verdict === 'MARGINAL' ? 'var(--amber)' : 'var(--crimson)';
  const glow = verdict === 'ROBUST' ? 'rgba(0,255,136,0.4)' : verdict === 'MARGINAL' ? 'rgba(255,149,0,0.4)' : 'rgba(255,59,48,0.4)';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 160, height: 100 }}>
        <svg width={160} height={100} viewBox="0 0 160 100">
          {/* Background arc */}
          <path
            d="M 20 90 A 60 60 0 0 1 140 90"
            fill="none"
            stroke="var(--graphite-500)"
            strokeWidth={8}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 20 90 A 60 60 0 0 1 140 90"
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 188} 188`}
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className="font-mono text-[28px] font-bold tabular-nums"
            style={{
              color,
              textShadow: `0 0 8px ${glow}, 0 0 16px ${glow}`,
            }}
          >
            {score}
          </span>
        </div>
      </div>
      <span
        className="font-mono text-[11px] uppercase tracking-[0.08em] font-bold mt-1 px-2 py-0.5"
        style={{
          color,
          background: `${color}15`,
          border: `1px solid ${color}40`,
        }}
      >
        {verdict}
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="p-2" style={{ background: 'var(--graphite-900)', border: '1px solid var(--text-2)' }}>
      <p className="font-mono text-[9px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--text-2)' }}>
        Trade #{label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono text-[10px] tabular-nums" style={{ color: p.color || 'var(--text-1)' }}>
          {p.name}: ${p.value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
}

export function RobustnessPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(true);

  const score = 82;
  const verdict = 'ROBUST';

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-4 w-1" style={{ background: 'var(--neon)', boxShadow: '0 0 8px rgba(0,255,136,0.4)' }} />
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-1)' }}>
          Robustness Laboratory
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-3)' }}>
          SURFACE ANALYSIS — NOT PEAK HUNTING
        </span>
      </div>

      {/* Control bar */}
      <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
        <div className="p-4 flex items-center gap-6">
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>MC SIMULATIONS</span>
            <span className="font-mono text-[12px] font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>1,000</span>
          </div>
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>SOURCE</span>
            <span className="font-mono text-[12px]" style={{ color: 'var(--text-2)' }}>OPTIMIZATION #OPT-047</span>
          </div>
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>TRADES</span>
            <span className="font-mono text-[12px] font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>347</span>
          </div>
          <button
            onClick={() => { setIsRunning(true); setTimeout(() => { setIsRunning(false); setShowResults(true); }, 3000); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] font-bold"
            style={{
              background: isRunning ? 'var(--graphite-700)' : 'var(--text-1)',
              color: isRunning ? 'var(--text-2)' : 'var(--void)',
              border: `1px solid ${isRunning ? 'var(--graphite-400)' : 'var(--text-1)'}`,
              cursor: 'pointer',
            }}
          >
            {isRunning ? <><ShieldCheck size={11} className="animate-pulse" /> ANALYZING...</> : <><Play size={11} /> RUN ROBUSTNESS TEST</>}
          </button>
        </div>
      </div>

      {showResults && (
        <>
          {/* Score + Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            {/* Gauge */}
            <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
              <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
                <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
                  ROBUSTNESS SCORE
                </h3>
              </div>
              <div className="p-4 flex justify-center">
                <RobustnessGauge score={score} verdict={verdict} />
              </div>
            </div>

            {/* Scoring breakdown */}
            <div className="relative overflow-hidden border col-span-3" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
              <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
                <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
                  SCORING BREAKDOWN (4 DIMENSIONS)
                </h3>
              </div>
              <div className="p-4 grid grid-cols-4 gap-4">
                {[
                  { label: 'WALK-FORWARD CONSISTENCY', score: 21, max: 25, detail: 'PF σ=0.12 across folds', color: 'var(--neon)' },
                  { label: 'MONTE CARLO STABILITY', score: 22, max: 25, detail: 'Worst DD: -14.2%', color: 'var(--neon)' },
                  { label: 'PARAMETER SENSITIVITY', score: 19, max: 25, detail: 'Max slope: 0.15', color: 'var(--neon)' },
                  { label: 'OUT-OF-SAMPLE PERF', score: 20, max: 25, detail: 'Worst fold PF: 1.72', color: 'var(--neon)' },
                ].map((d) => (
                  <div key={d.label}>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-3)' }}>{d.label}</span>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="font-mono text-[20px] font-bold tabular-nums" style={{ color: d.color, textShadow: `0 0 6px ${d.color === 'var(--neon)' ? 'rgba(0,255,136,0.4)' : 'rgba(255,149,0,0.4)'}` }}>
                        {d.score}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums" style={{ color: 'var(--text-3)' }}>/{d.max}</span>
                    </div>
                    {/* Score bar */}
                    <div className="h-1 w-full mb-1" style={{ background: 'var(--graphite-600)' }}>
                      <div className="h-1" style={{ width: `${(d.score / d.max) * 100}%`, background: d.color }} />
                    </div>
                    <span className="font-mono text-[9px]" style={{ color: 'var(--text-3)' }}>{d.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monte Carlo Equity Cone */}
          <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
              <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--neon)', boxShadow: '0 0 4px var(--neon)' }} />
                MONTE CARLO EQUITY CONE — 1,000 SIMULATIONS
              </h3>
              <div className="flex items-center gap-3">
                {[
                  { label: 'P95', color: 'rgba(0,255,136,0.15)' },
                  { label: 'P50', color: '#00ff88' },
                  { label: 'P5', color: 'rgba(255,59,48,0.15)' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <span className="w-3 h-0.5" style={{ background: l.color }} />
                    <span className="font-mono text-[8px] uppercase" style={{ color: 'var(--text-3)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_MC_CONE}>
                  <defs>
                    <linearGradient id="mc95" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff88" stopOpacity={0.05} />
                      <stop offset="100%" stopColor="#00ff88" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="mc5" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff3b30" stopOpacity={0.05} />
                      <stop offset="100%" stopColor="#ff3b30" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--graphite-600)" vertical={false} opacity={0.3} />
                  <XAxis dataKey="trade" stroke="var(--text-3)" fontSize={9} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" />
                  <YAxis stroke="var(--text-3)" fontSize={9} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="P95" stroke="none" fill="rgba(0,255,136,0.06)" name="P95" />
                  <Area type="monotone" dataKey="P90" stroke="none" fill="rgba(0,255,136,0.06)" name="P90" />
                  <Area type="monotone" dataKey="P75" stroke="none" fill="rgba(0,255,136,0.08)" name="P75" />
                  <Area type="monotone" dataKey="P50" stroke="#00ff88" strokeWidth={2} fill="none" name="Median" />
                  <Area type="monotone" dataKey="P25" stroke="none" fill="rgba(255,59,48,0.04)" name="P25" />
                  <Area type="monotone" dataKey="P10" stroke="none" fill="rgba(255,59,48,0.04)" name="P10" />
                  <Area type="monotone" dataKey="P5" stroke="rgba(255,59,48,0.4)" strokeWidth={1} strokeDasharray="4 4" fill="none" name="P5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-2 gap-4">
            {/* MC Stats */}
            <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
              <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
                <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
                  MONTE CARLO STATISTICS
                </h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                {[
                  { label: 'MEDIAN RETURN', value: '+48.3%', color: 'var(--neon)' },
                  { label: 'P5 RETURN', value: '+12.1%', color: 'var(--amber)' },
                  { label: 'P95 RETURN', value: '+84.7%', color: 'var(--neon)' },
                  { label: 'MEDIAN DD', value: '-8.7%', color: 'var(--crimson)' },
                  { label: 'WORST DD', value: '-18.4%', color: 'var(--crimson)' },
                  { label: 'PROB RUIN', value: '0.3%', color: 'var(--neon)' },
                ].map((m) => (
                  <div key={m.label}>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>{m.label}</span>
                    <span className="font-mono text-[14px] font-bold tabular-nums" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cluster Analysis */}
            <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
              <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
                <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
                  PARAMETER CLUSTER ANALYSIS
                </h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                {[
                  { label: 'CLUSTERS FOUND', value: '4', color: 'var(--text-1)' },
                  { label: 'SELECTED', value: '#2 (LOWEST σ)', color: 'var(--neon)' },
                  { label: 'PF MEAN', value: '2.14', color: 'var(--neon)' },
                  { label: 'PF STD', value: '0.12', color: 'var(--text-1)' },
                  { label: 'CLUSTER SIZE', value: '47 trials', color: 'var(--text-1)' },
                  { label: 'WORST WF', value: 'PF 1.72', color: 'var(--amber)' },
                ].map((m) => (
                  <div key={m.label}>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>{m.label}</span>
                    <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final verdict card */}
          <div
            className="relative overflow-hidden border"
            style={{
              background: 'var(--graphite-800)',
              borderColor: 'var(--neon)',
              boxShadow: '0 0 12px rgba(0,255,136,0.08)',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'var(--neon)' }} />
            <div className="p-6 flex items-center gap-6">
              <ShieldCheck size={32} style={{ color: 'var(--neon)' }} />
              <div>
                <h3 className="font-mono text-[14px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--neon)', textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>
                  PRODUCTION READY — DEPLOY TO LIVE
                </h3>
                <p className="font-mono text-[10px]" style={{ color: 'var(--text-2)' }}>
                  Strategy passes all robustness checks. Parameter cluster #2 selected (lowest variance). Walk-forward PBO: 4.2%. Monte Carlo P5 return: +12.1%. Recommended for live deployment with 0.5% risk per trade.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
