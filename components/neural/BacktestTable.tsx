import clsx from 'clsx';
import { Backtest } from '../../lib/types';
import { StatusTag } from './StatusTag';

interface BacktestTableProps {
  backtests: Backtest[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function BacktestTable({ backtests, onSelect, selectedId }: BacktestTableProps) {
  return (
    <div className="neural-panel overflow-hidden">
      <div className="bg-[var(--graphite-900)] border-b border-[var(--graphite-400)] px-3 py-2 flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-2)] flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--neon)] rounded-full animate-pulse"></span>
          Backtest Registry
        </h3>
        <div className="flex items-center gap-2 text-[9px] text-[var(--text-3)] uppercase tracking-wider">
          <span>{backtests.length} Strategies Loaded</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-[var(--graphite-400)] text-[var(--text-3)] uppercase tracking-wider text-[9px]">
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Strategy Name</th>
              <th className="px-3 py-2 font-medium text-right">Timeframe</th>
              <th className="px-3 py-2 font-medium text-right">Net Profit</th>
              <th className="px-3 py-2 font-medium text-right">Win Rate</th>
              <th className="px-3 py-2 font-medium text-right">PF</th>
              <th className="px-3 py-2 font-medium text-right">DD</th>
            </tr>
          </thead>
          <tbody>
            {backtests.map((bt) => (
              <tr 
                key={bt.id} 
                onClick={() => onSelect(bt.id)}
                className={clsx(
                  "border-b border-[var(--graphite-600)] last:border-0 hover:bg-[var(--graphite-700)] cursor-pointer transition-colors duration-150 group",
                  selectedId === bt.id ? "bg-[var(--graphite-700)]" : ""
                )}
              >
                <td className="px-3 py-2 font-medium whitespace-nowrap">
                  <StatusTag status={bt.status} />
                </td>
                <td className="px-3 py-2 font-medium text-[var(--text-1)] group-hover:text-[var(--neon)] transition-colors">
                  {bt.name}
                  <div className="text-[9px] text-[var(--text-3)] font-normal tracking-wide mt-0.5">{bt.strategy}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono text-[var(--text-2)]">{bt.timeframe}</td>
                <td className={clsx("px-3 py-2 text-right font-mono font-bold tabular-nums", 
                  bt.metrics.totalPnL > 0 ? "text-[var(--neon)]" : "text-[var(--crimson)]"
                )}>
                  ${bt.metrics.totalPnL.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[var(--text-2)] tabular-nums">
                  {(bt.metrics.winRate * 100).toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right font-mono text-[var(--text-2)] tabular-nums">
                  {bt.metrics.profitFactor.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[var(--crimson)] tabular-nums">
                  {bt.metrics.maxDrawdown}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
