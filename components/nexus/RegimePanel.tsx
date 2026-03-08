'use client';

import { useState } from 'react';
import { BrainCircuit, Play, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import type { RegimeLabel } from '@/lib/nexus-types';

const REGIME_COLORS: Record<RegimeLabel, string> = {
  TREND_BULL: '#00ff88',
  TREND_BEAR: '#ff3b30',
  DRIFT: '#888888',
  COMPRESSION: '#ff9500',
  VOL_EXPANSION: '#a78bfa',
  MEAN_REVERT: '#ffffff',
};

const REGIME_LABELS: Record<RegimeLabel, string> = {
  TREND_BULL: 'TREND BULL',
  TREND_BEAR: 'TREND BEAR',
  DRIFT: 'DRIFT',
  COMPRESSION: 'COMPRESSION',
  VOL_EXPANSION: 'VOL EXPANSION',
  MEAN_REVERT: 'MEAN REVERT',
};

// Mock feature importance (SHAP values)
const MOCK_FEATURES = [
  { feature: 'ATR_PERCENTILE_14', importance: 0.182 },
  { feature: 'ROLLING_VOL_20', importance: 0.156 },
  { feature: 'ADX_14', importance: 0.134 },
  { feature: 'EMA_SLOPE_20', importance: 0.118 },
  { feature: 'RANGE_COMPRESS_10', importance: 0.095 },
  { feature: 'RSI_14', importance: 0.072 },
  { feature: 'SESSION_FLAG', importance: 0.065 },
  { feature: 'DXY_MOMENTUM', importance: 0.058 },
  { feature: 'BBW_20', importance: 0.048 },
  { feature: 'MACD_HIST', importance: 0.042 },
  { feature: 'CORR_BASKET', importance: 0.030 },
];

// Mock regime distribution
const MOCK_DISTRIBUTION = [
  { name: 'TREND_BULL' as RegimeLabel, value: 22 },
  { name: 'TREND_BEAR' as RegimeLabel, value: 18 },
  { name: 'DRIFT' as RegimeLabel, value: 28 },
  { name: 'COMPRESSION' as RegimeLabel, value: 15 },
  { name: 'VOL_EXPANSION' as RegimeLabel, value: 8 },
  { name: 'MEAN_REVERT' as RegimeLabel, value: 9 },
];

// Mock confusion matrix
const MOCK_CONFUSION = [
  [0.82, 0.03, 0.08, 0.04, 0.02, 0.01],
  [0.04, 0.79, 0.06, 0.05, 0.04, 0.02],
  [0.07, 0.05, 0.71, 0.08, 0.04, 0.05],
  [0.03, 0.02, 0.09, 0.76, 0.06, 0.04],
  [0.02, 0.05, 0.03, 0.04, 0.81, 0.05],
  [0.01, 0.03, 0.06, 0.05, 0.03, 0.82],
];

// Mock regime parameter sets
const MOCK_REGIME_PARAMS = [
  { regime: 'TREND_BULL' as RegimeLabel, emaFast: 8, emaSlow: 32, sl: 14, tp: 28, fitness: 0.84 },
  { regime: 'TREND_BEAR' as RegimeLabel, emaFast: 7, emaSlow: 28, sl: 16, tp: 24, fitness: 0.79 },
  { regime: 'COMPRESSION' as RegimeLabel, emaFast: 10, emaSlow: 40, sl: 12, tp: 18, fitness: 0.72 },
  { regime: 'VOL_EXPANSION' as RegimeLabel, emaFast: 6, emaSlow: 24, sl: 18, tp: 36, fitness: 0.81 },
  { regime: 'MEAN_REVERT' as RegimeLabel, emaFast: 12, emaSlow: 48, sl: 15, tp: 22, fitness: 0.68 },
];

const REGIME_NAMES = ['BULL', 'BEAR', 'DRIFT', 'COMP', 'VOL', 'MEAN'];

export function RegimePanel() {
  const [modelType, setModelType] = useState<'xgboost' | 'lightgbm' | 'hmm'>('xgboost');
  const [isTraining, setIsTraining] = useState(false);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-4 w-1" style={{ background: 'var(--violet)', boxShadow: '0 0 8px rgba(167,139,250,0.4)' }} />
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--text-1)' }}>
          ML Regime Detection
        </h2>
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5" style={{ color: 'var(--violet)', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)' }}>
          ADAPTIVE STATE SWITCHING
        </span>
      </div>

      {/* Model config + accuracy */}
      <div className="grid grid-cols-3 gap-4">
        <div className="relative overflow-hidden border col-span-2" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
          <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
            <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
              <BrainCircuit size={12} /> MODEL CONFIGURATION
            </h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4">
              {(['xgboost', 'lightgbm', 'hmm'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setModelType(t)}
                  className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-all duration-100"
                  style={{
                    background: modelType === t ? 'var(--text-1)' : 'transparent',
                    color: modelType === t ? 'var(--void)' : 'var(--text-3)',
                    border: `1px solid ${modelType === t ? 'var(--text-1)' : 'var(--graphite-400)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => { setIsTraining(true); setTimeout(() => setIsTraining(false), 3000); }}
                className="ml-auto flex items-center gap-2 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] font-bold"
                style={{
                  background: isTraining ? 'var(--graphite-700)' : 'var(--violet)',
                  color: isTraining ? 'var(--text-2)' : '#000',
                  border: `1px solid ${isTraining ? 'var(--graphite-400)' : 'var(--violet)'}`,
                  cursor: 'pointer',
                }}
              >
                {isTraining ? <><RefreshCw size={10} className="animate-spin" /> TRAINING...</> : <><Play size={10} /> TRAIN MODEL</>}
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[
                { label: 'ACCURACY', value: '78.2%', color: 'var(--neon)' },
                { label: 'FEATURES', value: '11', color: 'var(--text-1)' },
                { label: 'TRAIN SET', value: '18,420', color: 'var(--text-1)' },
                { label: 'TEST SET', value: '7,860', color: 'var(--text-1)' },
                { label: 'REGIMES', value: '6', color: 'var(--violet)' },
              ].map((m) => (
                <div key={m.label}>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>{m.label}</span>
                  <span className="font-mono text-[16px] font-bold tabular-nums" style={{ color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regime distribution pie */}
        <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
          <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
            <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
              REGIME DISTRIBUTION
            </h3>
          </div>
          <div className="p-2" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_DISTRIBUTION}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  stroke="none"
                >
                  {MOCK_DISTRIBUTION.map((entry) => (
                    <Cell key={entry.name} fill={REGIME_COLORS[entry.name]} fillOpacity={0.7} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="px-3 pb-2 grid grid-cols-3 gap-1">
            {MOCK_DISTRIBUTION.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5" style={{ background: REGIME_COLORS[d.name] }} />
                <span className="font-mono text-[8px] uppercase" style={{ color: 'var(--text-3)' }}>
                  {REGIME_LABELS[d.name].slice(0, 8)} {d.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature importance (SHAP) */}
      <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
        <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
          <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--violet)', boxShadow: '0 0 4px var(--violet)' }} />
            FEATURE IMPORTANCE (SHAP VALUES)
          </h3>
        </div>
        <div className="p-4" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_FEATURES} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--graphite-600)" horizontal={false} opacity={0.3} />
              <XAxis type="number" stroke="var(--text-3)" fontSize={9} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" domain={[0, 0.2]} />
              <YAxis type="category" dataKey="feature" stroke="var(--text-3)" fontSize={9} tickLine={false} axisLine={false} fontFamily="'JetBrains Mono', monospace" width={130} />
              <Bar dataKey="importance" fill="var(--violet)" fillOpacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
        <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
          <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono" style={{ color: 'var(--text-2)' }}>
            CONFUSION MATRIX
          </h3>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-3)' }}>PRED →</th>
                  {REGIME_NAMES.map((n) => (
                    <th key={n} className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-center" style={{ color: 'var(--text-3)' }}>{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_CONFUSION.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-3)' }}>{REGIME_NAMES[i]}</td>
                    {row.map((cell, j) => {
                      const isDiag = i === j;
                      const intensity = Math.min(cell, 1);
                      return (
                        <td
                          key={j}
                          className="px-2 py-1 text-center font-mono text-[10px] tabular-nums"
                          style={{
                            color: isDiag ? 'var(--neon)' : `rgba(255,255,255,${0.3 + intensity * 0.5})`,
                            background: isDiag
                              ? `rgba(0,255,136,${intensity * 0.12})`
                              : `rgba(255,255,255,${cell * 0.05})`,
                          }}
                        >
                          {(cell * 100).toFixed(0)}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Regime-specific parameter sets */}
      <div className="relative overflow-hidden border" style={{ background: 'var(--graphite-800)', borderColor: 'var(--graphite-400)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)` }} />
        <div className="px-3 py-2 border-b" style={{ background: 'var(--graphite-900)', borderColor: 'var(--graphite-400)' }}>
          <h3 className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
            REGIME-SPECIFIC PARAMETER SETS
          </h3>
          <span className="font-mono text-[9px]" style={{ color: 'var(--text-3)' }}>
            Optimized parameters per market regime — adaptive switching
          </span>
        </div>
        <div className="p-3">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--graphite-400)' }}>
                {['REGIME', 'EMA FAST', 'EMA SLOW', 'STOP LOSS', 'TAKE PROFIT', 'FITNESS'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left font-mono text-[9px] uppercase tracking-[0.1em] font-medium" style={{ color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_REGIME_PARAMS.map((rp) => (
                <tr key={rp.regime} className="border-b" style={{ borderColor: 'var(--graphite-600)' }}>
                  <td className="px-2 py-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5" style={{ color: REGIME_COLORS[rp.regime], background: `${REGIME_COLORS[rp.regime]}15`, border: `1px solid ${REGIME_COLORS[rp.regime]}40` }}>
                      {REGIME_LABELS[rp.regime]}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--text-1)' }}>{rp.emaFast}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--text-1)' }}>{rp.emaSlow}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--text-1)' }}>{rp.sl}p</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums" style={{ color: 'var(--text-1)' }}>{rp.tp}p</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] tabular-nums font-bold" style={{ color: rp.fitness > 0.75 ? 'var(--neon)' : 'var(--amber)' }}>{rp.fitness.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
