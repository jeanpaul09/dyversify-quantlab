"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Backtest } from '../../lib/types';
import clsx from 'clsx';

interface EquityChartProps {
  data: Backtest;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--graphite-900)] border border-[var(--neon)] p-2 text-[10px] shadow-[0_0_12px_var(--neon-subtle)]">
        <p className="text-[var(--text-2)] mb-0.5 uppercase tracking-wider text-[9px]">{label}</p>
        <p className="text-[var(--neon)] font-mono font-bold text-xs tracking-tight">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function EquityChart({ data }: EquityChartProps) {
  const isPositive = data.metrics.totalPnL >= 0;
  const strokeColor = isPositive ? 'var(--neon)' : 'var(--crimson)';
  const gradientId = `gradient-${data.id}`;

  return (
    <div className="neural-panel p-3 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-2)] flex items-center gap-2">
          <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", isPositive ? "bg-[var(--neon)]" : "bg-[var(--crimson)]")}></span>
          Equity Curve Analysis
        </h3>
        <div className="flex items-center gap-4 text-[9px] text-[var(--text-3)] uppercase tracking-wider font-mono">
          <span className={clsx("font-bold", isPositive ? "text-[var(--neon)]" : "text-[var(--crimson)]")}>
            {isPositive ? '+' : ''}{data.metrics.totalPnL.toLocaleString()}
          </span>
          <span>|</span>
          <span>{data.equityCurve.length} data points</span>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.equityCurve}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--graphite-600)" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="var(--text-3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis 
              stroke="var(--text-3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--text-3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <ReferenceLine y={10000} stroke="var(--text-3)" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideBottomRight', value: 'INITIAL', fontSize: 9, fill: 'var(--text-3)' }} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={strokeColor} 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 4, fill: strokeColor, stroke: 'var(--void)', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
