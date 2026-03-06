'use client';

import { useState } from 'react';
import { Play, Square, TrendingUp, TrendingDown, BarChart3, Target, Clock } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import type { BacktestResult, BacktestMetrics } from '@/lib/nexus-types';

// Mock equity curve for UI development
const MOCK_EQUITY = Array.from({ length: 200 }, (_, i) => {
  const base = 10000;
  const trend = i * 8;
  const noise = Math.sin(i * 0.3) * 200 + Math.random() * 150;
  const dd = i > 80 && i < 100 ? -(i - 80) * 25 : 0;
  return {
    timestamp: `2024-${String(Math.floor(i / 20) + 1).padStart(2, '0')}-${String((i % 20) + 1).padStart(2, '0')}`,
    balance: Math.max(base + trend + noise + dd, base * 0.85),
    drawdown: Math.min(0, dd + noise * 0.3) / 100,
  };
});

const MOCK_METRICS: BacktestMetrics = {
  netProfit: 4832.50,
  profitFactor: 2.14,
  sharpeRatio: 1.87,
  recoveryFactor: 3.42,
  maxDrawdownPct: -8.72,
  winRate: 0.634,
  totalTrades: 347,
  expectedPayoff: 13.93,
  avgProfitTrade: 42.18,
  avgLossTrade: -22.45,
  maxConsecutiveWins: 12,
  maxConsecutiveLosses: 5,
  avgHoldBars: 4.2,
  grossProfit: 9284.30,
  grossLoss: -4451.80,
  longWinRate: 0.65,
  shortWinRate: 0.61,
};

function MetricCard({
  label,
  value,
  format = 'number',
  positive,
}: {
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent' | 'ratio';
  positive?: boolean;
}) {
  let display: string;
  let color = 'var(--text-1)';

  switch (format) {
    case 'currency':
      display = `$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      if (value > 0) { display = `+${display}`; color = 'var(--neon)'; }
      else if (value < 0) { display = `-${display}`; color = 'var(--crimson)'; }
      break;
    case 'percent':
      display = `${(value * 100).toFixed(1)}%`;
      if (positive !== undefined) color = positive ? 'var(--neon)' : 'var(--crimson)';
      break;
    case 'ratio':
      display = value.toFixed(2);
      if (value > 1.5) color = 'var(--neon)';
      else if (value < 1.0) color = 'var(--crimson)';
      break;
    default:
      display = typeof value === 'number' && !Number.isInteger(value)
        ? value.toFixed(2)
        : value.toLocaleString();
  }

  return (
    <div className="p-3">
      <span
        className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
        style={{ color: 'var(--text-3)' }}
      >
        {label}
      </span>
      <span
        className="font-mono text-[14px] font-bold tabular-nums"
        style={{
          color,
          textShadow: (color === 'var(--neon)' || color === 'var(--crimson)')
            ? `0 0 6px ${color === 'var(--neon)' ? 'rgba(0,255,136,0.4)' : 'rgba(255,59,48,0.4)'}`
            : 'none',
        }}
      >
        {display}
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="p-2"
      style={{
        background: 'var(--graphite-900)',
        border: '1px solid var(--neon)',
        boxShadow: '0 0 12px rgba(0,255,136,0.04)',
      }}
    >
      <p
        className="font-mono text-[9px] uppercase tracking-[0.08em] mb-1"
        style={{ color: 'var(--text-2)' }}
      >
        {label}
      </p>
      <p
        className="font-mono text-[12px] font-bold tabular-nums"
        style={{ color: 'var(--neon)' }}
      >
        ${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export function BacktestPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const m = MOCK_METRICS;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="h-4 w-1"
          style={{
            background: 'var(--text-1)',
            boxShadow: '0 0 8px rgba(255,255,255,0.3)',
          }}
        />
        <h2
          className="text-sm font-bold tracking-[0.2em] uppercase"
          style={{ color: 'var(--text-1)' }}
        >
          Vectorized Backtester
        </h2>
      </div>

      {/* Config bar */}
      <div
        className="relative overflow-hidden border"
        style={{
          background: 'var(--graphite-800)',
          borderColor: 'var(--graphite-400)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)`,
          }}
        />
        <div className="p-4 flex items-center gap-4 flex-wrap">
          {/* Strategy selector */}
          <div>
            <span
              className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
              style={{ color: 'var(--text-3)' }}
            >
              STRATEGY
            </span>
            <select
              className="font-mono text-[11px] px-3 py-1.5 border"
              style={{
                background: 'var(--graphite-700)',
                borderColor: 'var(--graphite-400)',
                color: 'var(--text-1)',
              }}
            >
              <option>Micro Intraday Trend</option>
              <option>EMA Crossover</option>
              <option>Scalper Momentum</option>
            </select>
          </div>

          {/* Symbol */}
          <div>
            <span
              className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
              style={{ color: 'var(--text-3)' }}
            >
              SYMBOL
            </span>
            <select
              className="font-mono text-[11px] px-3 py-1.5 border"
              style={{
                background: 'var(--graphite-700)',
                borderColor: 'var(--graphite-400)',
                color: 'var(--text-1)',
              }}
            >
              <option>GBPUSD</option>
              <option>EURUSD</option>
              <option>USDJPY</option>
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <span
              className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
              style={{ color: 'var(--text-3)' }}
            >
              TIMEFRAME
            </span>
            <select
              className="font-mono text-[11px] px-3 py-1.5 border"
              style={{
                background: 'var(--graphite-700)',
                borderColor: 'var(--graphite-400)',
                color: 'var(--text-1)',
              }}
            >
              <option>1H</option>
              <option>15M</option>
              <option>4H</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <span
              className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
              style={{ color: 'var(--text-3)' }}
            >
              PERIOD
            </span>
            <span
              className="font-mono text-[11px] tabular-nums"
              style={{ color: 'var(--text-2)' }}
            >
              2022-01 → 2025-12
            </span>
          </div>

          {/* Run button */}
          <div className="ml-auto">
            <button
              onClick={() => {
                setIsRunning(true);
                setTimeout(() => { setIsRunning(false); setShowResults(true); }, 2000);
              }}
              className="flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] font-bold transition-all duration-100"
              style={{
                background: isRunning ? 'var(--graphite-700)' : 'var(--text-1)',
                color: isRunning ? 'var(--text-2)' : 'var(--void)',
                border: `1px solid ${isRunning ? 'var(--graphite-400)' : 'var(--text-1)'}`,
                boxShadow: isRunning ? 'none' : '0 0 8px rgba(255,255,255,0.15)',
                cursor: 'pointer',
              }}
            >
              {isRunning ? (
                <>
                  <Square size={11} />
                  RUNNING...
                </>
              ) : (
                <>
                  <Play size={11} />
                  RUN BACKTEST
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showResults && (
        <>
          {/* Metrics grid */}
          <div
            className="relative overflow-hidden border"
            style={{
              background: 'var(--graphite-800)',
              borderColor: 'var(--graphite-400)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)`,
              }}
            />
            <div
              className="flex items-center justify-between px-3 py-2 border-b"
              style={{
                background: 'var(--graphite-900)',
                borderColor: 'var(--graphite-400)',
              }}
            >
              <h3
                className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2"
                style={{ color: 'var(--text-2)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#fff',
                    boxShadow: '0 0 4px rgba(255,255,255,0.5)',
                  }}
                />
                PERFORMANCE METRICS
              </h3>
              <span
                className="font-mono text-[9px] uppercase tracking-[0.08em]"
                style={{ color: 'var(--text-3)' }}
              >
                {m.totalTrades} TRADES | FITNESS: {(0.5 * Math.min(m.profitFactor / 5, 1) + 0.4 * (1 - Math.abs(m.maxDrawdownPct) / 50) + 0.1 * Math.min(m.netProfit / 10000, 1)).toFixed(3)}
              </span>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-8 divide-x" style={{ borderColor: 'var(--graphite-500)' }}>
              <MetricCard label="NET PROFIT" value={m.netProfit} format="currency" />
              <MetricCard label="PROFIT FACTOR" value={m.profitFactor} format="ratio" />
              <MetricCard label="SHARPE RATIO" value={m.sharpeRatio} format="ratio" />
              <MetricCard label="RECOVERY" value={m.recoveryFactor} format="ratio" />
              <MetricCard label="MAX DD" value={m.maxDrawdownPct} format="percent" positive={false} />
              <MetricCard label="WIN RATE" value={m.winRate} format="percent" positive={true} />
              <MetricCard label="TOTAL TRADES" value={m.totalTrades} />
              <MetricCard label="AVG HOLD" value={m.avgHoldBars} />
            </div>
          </div>

          {/* Equity curve chart */}
          <div
            className="relative overflow-hidden border"
            style={{
              background: 'var(--graphite-800)',
              borderColor: 'var(--graphite-400)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)`,
              }}
            />
            <div
              className="flex items-center justify-between px-3 py-2 border-b"
              style={{
                background: 'var(--graphite-900)',
                borderColor: 'var(--graphite-400)',
              }}
            >
              <h3
                className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono flex items-center gap-2"
                style={{ color: 'var(--text-2)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'var(--neon)',
                    boxShadow: '0 0 4px var(--neon)',
                  }}
                />
                EQUITY CURVE
              </h3>
              <span
                className="font-mono text-[9px] uppercase tracking-[0.08em]"
                style={{ color: 'var(--text-3)' }}
              >
                GBPUSD · MICRO INTRADAY TREND · 1H
              </span>
            </div>

            <div className="p-4" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_EQUITY}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff88" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#00ff88" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--graphite-600)"
                    vertical={false}
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="timestamp"
                    stroke="var(--text-3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="'JetBrains Mono', monospace"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="var(--text-3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    fontFamily="'JetBrains Mono', monospace"
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={10000}
                    stroke="var(--text-4)"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#00ff88"
                    strokeWidth={2}
                    fill="url(#equityGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary metrics row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Long vs Short */}
            <div
              className="relative overflow-hidden border"
              style={{
                background: 'var(--graphite-800)',
                borderColor: 'var(--graphite-400)',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)`,
                }}
              />
              <div
                className="px-3 py-2 border-b"
                style={{
                  background: 'var(--graphite-900)',
                  borderColor: 'var(--graphite-400)',
                }}
              >
                <h3
                  className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono"
                  style={{ color: 'var(--text-2)' }}
                >
                  DIRECTION ANALYSIS
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: 'var(--neon)' }} />
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-3)' }}>LONG WIN RATE</span>
                    <span className="font-mono text-[14px] font-bold tabular-nums" style={{ color: 'var(--neon)' }}>{(m.longWinRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown size={14} style={{ color: 'var(--crimson)' }} />
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-3)' }}>SHORT WIN RATE</span>
                    <span className="font-mono text-[14px] font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{(m.shortWinRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit distribution */}
            <div
              className="relative overflow-hidden border"
              style={{
                background: 'var(--graphite-800)',
                borderColor: 'var(--graphite-400)',
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)`,
                }}
              />
              <div
                className="px-3 py-2 border-b"
                style={{
                  background: 'var(--graphite-900)',
                  borderColor: 'var(--graphite-400)',
                }}
              >
                <h3
                  className="text-[10px] uppercase tracking-[0.1em] font-bold font-mono"
                  style={{ color: 'var(--text-2)' }}
                >
                  PROFIT DISTRIBUTION
                </h3>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-3)' }}>GROSS PROFIT</span>
                  <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: 'var(--neon)' }}>+${m.grossProfit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-3)' }}>GROSS LOSS</span>
                  <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: 'var(--crimson)' }}>-${Math.abs(m.grossLoss).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--text-3)' }}>AVG PAYOFF</span>
                  <span className="font-mono text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>${m.expectedPayoff.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
