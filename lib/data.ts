import { Backtest, EquityPoint } from './types';

// Improved generator for more realistic equity curves
function generateEquityCurve(startValue: number, volatility: number, trend: number, days: number): EquityPoint[] {
  let value = startValue;
  const curve: EquityPoint[] = [];
  const now = new Date();
  
  // Random seed consistency (pseudo) not needed here but good practice normally
  let momentum = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    
    // Add momentum to make "runs" of wins/losses instead of pure noise
    momentum = momentum * 0.8 + (Math.random() - 0.5) * volatility * 0.5;
    const change = (Math.random() - 0.5) * volatility + trend + momentum;
    
    value = value * (1 + change);
    
    curve.push({
      date: date.toISOString().split('T')[0],
      value: Number(value.toFixed(2))
    });
  }
  return curve;
}

export const backtests: Backtest[] = [
  {
    id: 'BT-001', // Standardized ID format
    name: 'MACD Momentum',
    strategy: 'Trend Following',
    timeframe: '1H',
    startDate: '2025-01-01',
    endDate: '2026-02-27',
    status: 'WINNER',
    metrics: {
      totalPnL: 12450, // Removed decimals
      winRate: 0.62,
      profitFactor: 1.8,
      sharpeRatio: 2.1,
      maxDrawdown: -12.4,
      trades: 142 // More realistic trade count
    },
    equityCurve: generateEquityCurve(10000, 0.015, 0.003, 90),
    trades: [],
  },
  {
    id: 'BT-002',
    name: 'Bollinger Mean Rev',
    strategy: 'Mean Reversion',
    timeframe: '15m',
    startDate: '2025-01-01',
    endDate: '2026-02-27',
    status: 'OPTIMIZE',
    metrics: {
      totalPnL: 3200,
      winRate: 0.55,
      profitFactor: 1.2,
      sharpeRatio: 0.9,
      maxDrawdown: -22.1,
      trades: 350
    },
    equityCurve: generateEquityCurve(10000, 0.02, 0.001, 90),
    trades: [],
  },
  {
    id: 'BT-003',
    name: 'Breakout v2',
    strategy: 'Breakout',
    timeframe: '4H',
    startDate: '2025-01-01',
    endDate: '2026-02-27',
    status: 'RETEST',
    metrics: {
      totalPnL: -1500,
      winRate: 0.38,
      profitFactor: 0.85,
      sharpeRatio: -0.4,
      maxDrawdown: -18.5,
      trades: 42
    },
    equityCurve: generateEquityCurve(10000, 0.015, -0.001, 90),
    trades: [],
  },
  {
    id: 'BT-004',
    name: 'Golden Cross',
    strategy: 'Trend Following',
    timeframe: '1D',
    startDate: '2025-01-01',
    endDate: '2026-02-27',
    status: 'WINNER',
    metrics: {
      totalPnL: 8900,
      winRate: 0.58,
      profitFactor: 1.5,
      sharpeRatio: 1.7,
      maxDrawdown: -15.0,
      trades: 28
    },
    equityCurve: generateEquityCurve(10000, 0.01, 0.002, 90),
    trades: [],
  }
];
