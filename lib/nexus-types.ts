// NEXUS ENGINE — Type Definitions
// Full-stack backtesting platform types

// ─── Data Pipeline ───────────────────────────────────────────

export interface HistoricalBar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  spread: number;
}

export interface DatasetInfo {
  id: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  barCount: number;
  avgSpread: number;
  gaps: number;
  quality: 'CLEAN' | 'MINOR_GAPS' | 'DEGRADED';
  createdAt: string;
}

// ─── Strategy ────────────────────────────────────────────────

export interface ParameterDef {
  name: string;
  type: 'int' | 'float' | 'bool' | 'select';
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean | string;
  options?: string[];
  description: string;
  group: string; // 'entry', 'exit', 'filter', 'risk'
}

export interface StrategyDef {
  id: string;
  name: string;
  style: string;
  description: string;
  parameters: ParameterDef[];
  fitnessWeights: FitnessWeights;
}

export interface FitnessWeights {
  profitFactor: number;  // default 0.5
  maxDrawdown: number;   // default 0.4
  netProfit: number;     // default 0.1
}

// ─── Backtest Results ────────────────────────────────────────

export interface BacktestMetrics {
  netProfit: number;
  profitFactor: number;
  sharpeRatio: number;
  recoveryFactor: number;
  maxDrawdownPct: number;
  winRate: number;
  totalTrades: number;
  expectedPayoff: number;
  avgProfitTrade: number;
  avgLossTrade: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgHoldBars: number;
  grossProfit: number;
  grossLoss: number;
  longWinRate: number;
  shortWinRate: number;
}

export interface BacktestTrade {
  timestamp: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pips: number;
  holdBars: number;
  exitReason: 'SL' | 'TP' | 'TRAIL' | 'SIGNAL' | 'SESSION';
}

export interface EquityCurvePoint {
  timestamp: string;
  balance: number;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  symbol: string;
  timeframe: string;
  parameters: Record<string, number | boolean | string>;
  metrics: BacktestMetrics;
  equityCurve: EquityCurvePoint[];
  trades: BacktestTrade[];
  inSampleStart: string;
  inSampleEnd: string;
  outSampleStart?: string;
  outSampleEnd?: string;
  fitnessScore: number;
  isWalkForward: boolean;
  foldIndex?: number;
  createdAt: string;
}

// ─── Optimization ────────────────────────────────────────────

export type OptimizerType = 'optuna' | 'deap' | 'grid';
export type OptimizationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface OptimizationConfig {
  strategyId: string;
  symbol: string;
  timeframe: string;
  optimizer: OptimizerType;
  nTrials: number;               // 500–2000
  fitnessWeights: FitnessWeights;
  searchSpace: Record<string, { min: number; max: number; step?: number }>;
  walkForward: {
    enabled: boolean;
    inSamplePct: number;         // 0.7 = 70%
    nFolds: number;              // 3-5
    stepMonths: number;          // 6
  };
  cpcv: {
    enabled: boolean;
    nSplits: number;             // 100+
    purgeWindow: number;         // 2 bars
    embargoWindow: number;       // 1 bar
  };
}

export interface OptimizationRun {
  id: string;
  strategyId: string;
  symbol: string;
  status: OptimizationStatus;
  optimizer: OptimizerType;
  config: OptimizationConfig;
  totalTrials: number;
  completedTrials: number;
  bestFitness: number;
  bestParams: Record<string, number | boolean | string>;
  topClusters: ParameterCluster[];
  parameterSensitivity: Record<string, number>;
  walkForwardResults: WalkForwardFold[];
  pbo: number;                   // Probability of Backtest Overfitting
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ParameterCluster {
  id: number;
  center: Record<string, number>;
  meanFitness: number;
  stdFitness: number;
  size: number;
  isSelected: boolean;
}

export interface WalkForwardFold {
  foldIndex: number;
  inSampleStart: string;
  inSampleEnd: string;
  outSampleStart: string;
  outSampleEnd: string;
  inSampleFitness: number;
  outSampleFitness: number;
  outSamplePF: number;
  outSampleDD: number;
  equityCurve: EquityCurvePoint[];
}

// ─── Regime Detection ────────────────────────────────────────

export type RegimeLabel =
  | 'TREND_BULL'
  | 'TREND_BEAR'
  | 'DRIFT'
  | 'COMPRESSION'
  | 'VOL_EXPANSION'
  | 'MEAN_REVERT';

export interface RegimeModel {
  id: string;
  symbol: string;
  modelType: 'xgboost' | 'lightgbm' | 'hmm';
  features: string[];
  accuracy: number;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
  regimeDistribution: Record<RegimeLabel, number>;
  createdAt: string;
}

export interface RegimePrediction {
  timestamp: string;
  regime: RegimeLabel;
  probabilities: Record<RegimeLabel, number>;
  confidence: number;
}

export interface RegimeParameterSet {
  regime: RegimeLabel;
  parameters: Record<string, number | boolean | string>;
  fitness: number;
  sampleSize: number;
}

// ─── Robustness ──────────────────────────────────────────────

export type RobustnessVerdict = 'ROBUST' | 'MARGINAL' | 'FRAGILE';

export interface MonteCarloResult {
  nSimulations: number;
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
  maxDrawdowns: number[];
  medianReturn: number;
  p5Return: number;
  p95Return: number;
  medianDD: number;
  worstDD: number;
  probRuin: number;
}

export interface RobustnessReport {
  id: string;
  backtestId: string;
  optimizationRunId?: string;
  monteCarlo: MonteCarloResult;
  pfMean: number;
  pfStd: number;
  worstWfSlice: number;
  paramSensitivityMax: number;
  robustnessScore: number;       // 0–100
  verdict: RobustnessVerdict;
  createdAt: string;
}

// ─── UI State ────────────────────────────────────────────────

export type NexusTab = 'DATA' | 'BACKTEST' | 'OPTIMIZE' | 'REGIME' | 'ROBUSTNESS';

export interface NexusState {
  activeTab: NexusTab;
  datasets: DatasetInfo[];
  strategies: StrategyDef[];
  selectedStrategy?: string;
  selectedSymbol?: string;
  backtestResults: BacktestResult[];
  optimizationRuns: OptimizationRun[];
  regimeModels: RegimeModel[];
  robustnessReports: RobustnessReport[];
  isLoading: boolean;
  error?: string;
}
