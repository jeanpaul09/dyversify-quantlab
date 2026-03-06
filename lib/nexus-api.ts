// NEXUS ENGINE — API Client
// Communicates with Python FastAPI backend via Supabase Edge Functions

import type {
  BacktestResult,
  DatasetInfo,
  OptimizationConfig,
  OptimizationRun,
  RegimeModel,
  RegimePrediction,
  RobustnessReport,
  StrategyDef,
} from './nexus-types';

const API_BASE = process.env.NEXT_PUBLIC_NEXUS_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  return res.json();
}

// ─── Data Pipeline ───────────────────────────────────────────

export async function uploadHistoricalData(
  file: File,
  symbol: string,
  timeframe: string,
): Promise<DatasetInfo> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('symbol', symbol);
  formData.append('timeframe', timeframe);

  const res = await fetch(`${API_BASE}/api/data/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function getDatasets(): Promise<DatasetInfo[]> {
  return request('/api/data/datasets');
}

export async function getSymbols(): Promise<string[]> {
  return request('/api/data/symbols');
}

// ─── Strategies ──────────────────────────────────────────────

export async function getStrategies(): Promise<StrategyDef[]> {
  return request('/api/strategies');
}

export async function getStrategy(id: string): Promise<StrategyDef> {
  return request(`/api/strategies/${id}`);
}

// ─── Backtesting ─────────────────────────────────────────────

export async function runBacktest(params: {
  strategyId: string;
  symbol: string;
  timeframe: string;
  parameters: Record<string, number | boolean | string>;
  startDate: string;
  endDate: string;
}): Promise<BacktestResult> {
  return request('/api/backtest/run', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getBacktestResults(
  strategyId?: string,
  symbol?: string,
): Promise<BacktestResult[]> {
  const params = new URLSearchParams();
  if (strategyId) params.set('strategy_id', strategyId);
  if (symbol) params.set('symbol', symbol);
  return request(`/api/backtest/results?${params}`);
}

export async function getBacktestResult(id: string): Promise<BacktestResult> {
  return request(`/api/backtest/results/${id}`);
}

// ─── Optimization ────────────────────────────────────────────

export async function startOptimization(
  config: OptimizationConfig,
): Promise<OptimizationRun> {
  return request('/api/optimize/start', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

export async function getOptimizationStatus(id: string): Promise<OptimizationRun> {
  return request(`/api/optimize/${id}/status`);
}

export async function getOptimizationRuns(): Promise<OptimizationRun[]> {
  return request('/api/optimize/runs');
}

export async function cancelOptimization(id: string): Promise<void> {
  return request(`/api/optimize/${id}/cancel`, { method: 'POST' });
}

// ─── Regime Detection ────────────────────────────────────────

export async function trainRegimeModel(params: {
  symbol: string;
  modelType: 'xgboost' | 'lightgbm' | 'hmm';
  features?: string[];
}): Promise<RegimeModel> {
  return request('/api/regime/train', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function predictRegime(params: {
  symbol: string;
  modelId: string;
}): Promise<RegimePrediction[]> {
  return request('/api/regime/predict', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getRegimeModels(): Promise<RegimeModel[]> {
  return request('/api/regime/models');
}

// ─── Robustness ──────────────────────────────────────────────

export async function runRobustnessTest(params: {
  backtestId: string;
  optimizationRunId?: string;
  mcSimulations?: number;
}): Promise<RobustnessReport> {
  return request('/api/robustness/run', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getRobustnessReport(id: string): Promise<RobustnessReport> {
  return request(`/api/robustness/${id}`);
}

export async function getRobustnessReports(): Promise<RobustnessReport[]> {
  return request('/api/robustness/reports');
}
