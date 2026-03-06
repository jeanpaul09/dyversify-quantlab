import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';
import { Metrics } from '../../lib/types';

interface MetricsPanelProps {
  metrics: Metrics;
}

interface MetricCardProps {
  title: string;
  value: string;
  trend: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  subValue?: string;
  glow?: 'neon' | 'amber' | 'crimson';
}

function MetricCard({ title, value, trend, subValue, glow = 'neon' }: MetricCardProps) {
  const trendColor = trend === 'positive' ? 'text-[var(--neon)]' : trend === 'negative' ? 'text-[var(--crimson)]' : 'text-[var(--text-3)]';
  // Removed glow classes from here to clean up the UI
  
  return (
    <div className={clsx(
      "p-3 border rounded-sm relative overflow-hidden transition-all duration-300", // Reduced padding from p-4 to p-3
      "bg-[var(--graphite-800)] border-[var(--graphite-400)]",
      "hover:border-[var(--neon)]" // Subtle border hover only
    )}>
      <h3 className="text-[9px] uppercase tracking-widest text-[var(--text-3)] mb-1 font-bold">{title}</h3> 
      <div className="flex items-end justify-between">
        <div className={clsx("text-lg font-mono tabular-nums tracking-tight font-bold", trendColor)}> 
          {value}
        </div>
        {subValue && (
          <span className="text-[9px] text-[var(--text-2)] mb-0.5 tracking-wider uppercase"> 
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  // Helper for cleaner numbers
  const formatMoney = (val: number) => `$${Math.round(val).toLocaleString()}`;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      <MetricCard 
        title="Total PnL" 
        value={formatMoney(metrics.totalPnL)}
        trend={metrics.totalPnL > 0 ? 'positive' : 'negative'}
        subValue="+12.4% THIS MONTH"
      />
      <MetricCard 
        title="Win Rate" 
        value={`${(metrics.winRate * 100).toFixed(1)}%`} 
        trend={metrics.winRate > 0.5 ? 'positive' : 'negative'}
        subValue={`${metrics.trades} TRADES`}
      />
      <MetricCard 
        title="Profit Factor" 
        value={metrics.profitFactor.toFixed(2)} 
        trend={metrics.profitFactor > 1.5 ? 'positive' : metrics.profitFactor < 1 ? 'negative' : 'neutral'}
        subValue="GROSS PROFIT / LOSS"
      />
      <MetricCard 
        title="Sharpe Ratio" 
        value={metrics.sharpeRatio.toFixed(2)} 
        trend={metrics.sharpeRatio > 1 ? 'positive' : metrics.sharpeRatio < 0 ? 'negative' : 'neutral'}
        subValue="RISK ADJUSTED"
      />
      <MetricCard 
        title="Max Drawdown" 
        value={`${metrics.maxDrawdown}%`} 
        trend="negative"
        subValue="PEAK TO TROUGH"
        glow="crimson"
      />
      <MetricCard 
        title="Active Signals" 
        value="4" 
        trend="neutral"
        subValue="LIVE EXECUTIONS"
        glow="amber"
      />
    </div>
  );
}
