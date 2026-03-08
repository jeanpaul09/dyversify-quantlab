'use client';

import { useState, useEffect } from 'react';
import { Cpu, Play, Square, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, Cell,
  BarChart, Bar,
} from 'recharts';

// Mock optimization convergence data
const MOCK_CONVERGENCE = Array.from({ length: 150 }, (_, i) => ({
  trial: i + 1,
  fitness: Math.min(
    0.3 + 0.5 * (1 - Math.exp(-i / 30)) + (Math.random() - 0.5) * 0.08,
    0.85,
  ),
  bestSoFar: 0,
})).map((d, i, arr) => ({
  ...d,
  bestSoFar: Math.max(d.fitness, i > 0 ? arr[i - 1].bestSoFar : 0),
}));

// Mock parameter importance
const MOCK_IMPORTANCE = [
  { param: 'EMA_SLOW', importance: 0.28 },
  { param: 'STOP_LOSS', importance: 0.22 },
  { param: 'EMA_FAST', importance: 0.18 },
  { param: 'SESSION', importance: 0.12 },
  { param: 'TRAIL_DIST', importance: 0.08 },
  { param: 'TP_RATIO', importance: 0.06 },
  { param: 'ADX_THRESH', importance: 0.04 },
  { param: 'VOL_FILTER', importance: 0.02 },
];

// Mock sensitivity data
const MOCK_SENSITIVITY = [
  { param: 'EMA_FAST', slope: 0.12, verdict: 'STABLE' },
  { param: 'EMA_SLOW', slope: 0.08, verdict: 'STABLE' },
  { param: 'STOP_LOSS', slope: 0.15, verdict: 'STABLE' },
  { param: 'TAKE_PROFIT', slope: 0.32, verdict: 'SENSITIVE' },
  { param: 'TRAIL_DIST', slope: 0.45, verdict: 'FRAGILE' },
  { param: 'SESSION', slope: 0.05, verdict: 'STABLE' },
  { param: 'ADX_THRESH', slope: 0.21, verdict: 'MODERATE' },
];

// Mock WF folds
const MOCK_WF_FOLDS = [
  { fold: 1, is_pf: 2.31, oos_pf: 1.89, is_dd: -6.2, oos_dd: -8.4, period: '2022–2024 → 2024' },
  { fold: 2, is_pf: 2.18, oos_pf: 1.72, is_dd: -7.1, oos_dd: -9.8, period: '2022–2024 → 2025' },
  { fold: 3, is_pf: 2.45, oos_pf: 1.95, is_dd: -5.8, oos_dd: -7.2, period: '2023–2025 → 2025' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="p-2"
      style={{
        background: 'var(--graphite-900)',
        border: '1px solid var(--text-2)',
        boxShadow: '0 0 8px rgba(255,255,255,0.05)',
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--text-2)' }}>
        Trial {label}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono text-[11px] tabular-nums" style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed(4)}
        </p>
      ))}
    </div>
  );
}

export function OptimizePanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalTrials, setTotalTrials] = useState(1500);
  const [showResults, setShowResults] = useState(true);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= totalTrials) {
          setIsRunning(false);
          setShowResults(true);
          return totalTrials;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, totalTrials]);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-4 w-1" style={{ background: 'var(--text-1)', boxShadow: '0 0 8px rgba(255,255,255,0.3)' }} />
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-1)' }}>
          Bayesian Optimization Engine
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5" style={{ color: 'var(--violet)', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)' }}>
          OPTUNA TPE + CMA-ES
        </span>
      </div>

      {/* Config panel */}
      <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />

        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
          <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
            <Cpu size={12} /> OPTIMIZATION CONFIG
          </h3>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            {[
              { label: 'TRIALS', value: '1,500' },
              { label: 'OPTIMIZER', value: 'OPTUNA TPE' },
              { label: 'WF FOLDS', value: '3' },
              { label: 'CPCV SPLITS', value: '100' },
              { label: 'IN-SAMPLE', value: '70%' },
              { label: 'SYMBOL', value: 'GBPUSD 1H' },
            ].map((c) => (
              <div key={c.label}>
                <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>{c.label}</span>
                <span className="font-mono text-[12px] tabular-nums font-bold" style={{ color: 'var(--text-1)' }}>{c.value}</span>
              </div>
            ))}
          </div>

          {/* Fitness weights */}
          <div className="flex items-center gap-6 mb-4 pt-3 border-t" style={{ borderColor: 'var(--graphite-500)' }}>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-3)' }}>FITNESS WEIGHTS:</span>
            {[
              { label: 'PROFIT FACTOR', weight: '50%', color: 'var(--neon)' },
              { label: 'MAX DRAWDOWN', weight: '40%', color: 'var(--amber)' },
              { label: 'NET PROFIT', weight: '10%', color: 'var(--text-1)' },
            ].map((w) => (
              <div key={w.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2" style={{ background: w.color }} />
                <span className="font-mono text-[9px] uppercase tracking-[0.05em]" style={{ color: 'var(--text-2)' }}>{w.label}</span>
                <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: w.color }}>{w.weight}</span>
              </div>
            ))}
          </div>

          {/* Run button + progress */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setIsRunning(true); setProgress(0); setShowResults(false); }}
              className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] font-bold transition-all duration-100"
              style={{
                background: isRunning ? 'var(--graphite-700)' : 'var(--text-1)',
                color: isRunning ? 'var(--text-2)' : 'var(--void)',
                border: `1px solid ${isRunning ? 'var(--graphite-400)' : 'var(--text-1)'}`,
                cursor: 'pointer',
              }}
            >
              {isRunning ? <><Square size={11} /> OPTIMIZING...</> : <><Zap size={11} /> START OPTIMIZATION</>}
            </button>

            {isRunning && (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] tabular-nums" style={{ color: 'var(--text-2)' }}>
                    {Math.min(progress, totalTrials).toLocaleString()} / {totalTrials.toLocaleString()} TRIALS
                  </span>
                  <span className="font-mono text-[9px] tabular-nums" style={{ color: 'var(--text-2)' }}>
                    {Math.min(Math.round((progress / totalTrials) * 100), 100)}%
                  </span>
                </div>
                <div className="h-1 w-full" style={{ background: 'var(--graphite-600)' }}>
                  <div
                    className="h-1 transition-all duration-100"
                    style={{
                      width: `${Math.min((progress / totalTrials) * 100, 100)}%`,
                      background: 'var(--text-1)',
                      boxShadow: '0 0 4px rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showResults && (
        <>
          {/* Convergence chart */}
          <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
              <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
                OPTIMIZATION CONVERGENCE
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--neon)' }}>
                BEST FITNESS: 0.8234
              </span>
            </div>
            <div className="p-4" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_CONVERGENCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--graphite-600)" vertical={false} opacity={0.3} />
                  <XAxis dataKey="trial" stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" />
                  <YAxis stroke="var(--text-3)" fontSize={10} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" domain={[0, 1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="fitness" stroke="var(--text-3)" strokeWidth={1} dot={false} opacity={0.4} name="Trial Fitness" />
                  <Line type="monotone" dataKey="bestSoFar" stroke="var(--neon)" strokeWidth={2} dot={false} name="Best So Far" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Parameter importance + Sensitivity */}
          <div className="grid grid-cols-2 gap-4">
            {/* Importance */}
            <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
              <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
                <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
                  PARAMETER IMPORTANCE
                </h3>
              </div>
              <div className="p-4" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_IMPORTANCE} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--graphite-600)" horizontal={false} opacity={0.3} />
                    <XAxis type="number" stroke="var(--text-3)" fontSize={9} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" domain={[0, 0.35]} />
                    <YAxis type="category" dataKey="param" stroke="var(--text-3)" fontSize={9} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" width={80} />
                    <Bar dataKey="importance" fill="var(--text-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sensitivity */}
            <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
              <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
                <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
                  PARAMETER SENSITIVITY
                </h3>
              </div>
              <div className="p-3">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--graphite-400)' }}>
                      {['PARAMETER', 'SLOPE', 'VERDICT'].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-mono text-[9px] uppercase tracking-[0.1em] font-medium" style={{ color: 'var(--text-3)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_SENSITIVITY.map((s) => (
                      <tr key={s.param} className="border-b" style={{ borderColor: 'var(--graphite-600)' }}>
                        <td className="px-2 py-1.5 font-mono text-[10px]" style={{ color: 'var(--text-2)' }}>{s.param}</td>
                        <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--text-1)' }}>{s.slope.toFixed(3)}</td>
                        <td className="px-2 py-1.5">
                          <span className="font-mono text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5" style={{
                            color: s.verdict === 'STABLE' ? 'var(--neon)' : s.verdict === 'FRAGILE' ? 'var(--crimson)' : 'var(--amber)',
                            background: s.verdict === 'STABLE' ? 'rgba(0,255,136,0.08)' : s.verdict === 'FRAGILE' ? 'rgba(255,59,48,0.1)' : 'rgba(255,149,0,0.1)',
                            border: `1px solid ${s.verdict === 'STABLE' ? 'rgba(0,255,136,0.25)' : s.verdict === 'FRAGILE' ? 'rgba(255,59,48,0.25)' : 'rgba(255,149,0,0.25)'}`,
                          }}>
                            {s.verdict}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Walk-Forward Results */}
          <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
              <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
                WALK-FORWARD VALIDATION
              </h3>
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5" style={{ color: 'var(--neon)', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                PBO: 4.2% (TARGET &lt;10%)
              </span>
            </div>
            <div className="p-3">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--graphite-400)' }}>
                    {['FOLD', 'PERIOD', 'IS PF', 'OOS PF', 'IS DD', 'OOS DD', 'STATUS'].map((h) => (
                      <th key={h} className="px-2 py-1.5 text-left font-mono text-[9px] uppercase tracking-[0.1em] font-medium" style={{ color: 'var(--text-3)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_WF_FOLDS.map((f) => (
                    <tr key={f.fold} className="border-b" style={{ borderColor: 'var(--graphite-600)' }}>
                      <td className="px-2 py-1.5 font-mono text-[10px]" style={{ color: 'var(--text-2)' }}>#{f.fold}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px]" style={{ color: 'var(--text-3)' }}>{f.period}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--neon)' }}>{f.is_pf.toFixed(2)}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: f.oos_pf > 1.5 ? 'var(--neon)' : 'var(--amber)' }}>{f.oos_pf.toFixed(2)}</td>
                      <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--crimson)' }}>{f.is_dd.toFixed(1)}%</td>
                      <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--crimson)' }}>{f.oos_dd.toFixed(1)}%</td>
                      <td className="px-2 py-1.5">
                        <span className="font-mono text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5" style={{ color: 'var(--neon)', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                          PASS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
