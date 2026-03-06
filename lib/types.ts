export type Status = 'WINNER' | 'RETEST' | 'OPTIMIZE';

export interface Metrics {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  trades: number;
}

export interface EquityPoint {
  date: string;
  value: number;
}

export interface Trade {
  date: string;
  profit: number;
  balance: number;
  side: 'LONG' | 'SHORT';
  holdBars: number;
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;
}

export interface MonthlyReturn {
  month: string;
  returnPct: number;
}

export interface StreakPoint {
  index: number;
  streak: number;
  label: string;
}

export interface Backtest {
  id: string;
  name: string;
  strategy: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  status: Status;
  metrics: Metrics;
  equityCurve: EquityPoint[];
  trades: Trade[];
}

export interface Portfolio {
  id: string;
  name: string;
  reportIds: string[];
  created: string;
}

export interface MonteCarloResult {
  percentiles: {
    P5: number[];
    P10: number[];
    P25: number[];
    P50: number[];
    P75: number[];
    P90: number[];
    P95: number[];
  };
  finalEquities: number[];
  maxDDs: number[];
  initBal: number;
  numTrades: number;
  numSims: number;
  metrics: {
    medianReturn: number;
    p10Return: number;
    p90Return: number;
    medianDD: number;
    worstDD: number;
    bestDD: number;
    probRuin: number;
    medianSharpe: number;
  };
}
