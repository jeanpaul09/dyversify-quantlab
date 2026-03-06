'use client';

import { useState, useCallback } from 'react';
import {
  Upload, Database, CheckCircle, AlertTriangle,
  Clock, BarChart3, Trash2, RefreshCw,
} from 'lucide-react';
import type { DatasetInfo } from '@/lib/nexus-types';

// Mock datasets for UI development — will be replaced with API calls
const MOCK_DATASETS: DatasetInfo[] = [
  {
    id: 'ds-001',
    symbol: 'GBPUSD',
    timeframe: '1H',
    startDate: '2022-01-03',
    endDate: '2025-12-31',
    barCount: 26280,
    avgSpread: 1.2,
    gaps: 3,
    quality: 'CLEAN',
    createdAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'ds-002',
    symbol: 'EURUSD',
    timeframe: '1H',
    startDate: '2022-01-03',
    endDate: '2025-12-31',
    barCount: 26280,
    avgSpread: 0.8,
    gaps: 1,
    quality: 'CLEAN',
    createdAt: '2026-03-05T10:05:00Z',
  },
  {
    id: 'ds-003',
    symbol: 'USDJPY',
    timeframe: '1H',
    startDate: '2022-01-03',
    endDate: '2025-12-31',
    barCount: 26275,
    avgSpread: 1.0,
    gaps: 8,
    quality: 'MINOR_GAPS',
    createdAt: '2026-03-05T10:10:00Z',
  },
];

const QUALITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CLEAN: { color: 'var(--neon)', bg: 'rgba(0,255,136,0.08)', label: 'CLEAN' },
  MINOR_GAPS: { color: 'var(--amber)', bg: 'rgba(255,149,0,0.1)', label: 'MINOR GAPS' },
  DEGRADED: { color: 'var(--crimson)', bg: 'rgba(255,59,48,0.1)', label: 'DEGRADED' },
};

function SectionHeader({ title, meta }: { title: string; meta?: string }) {
  return (
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
            animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        {title}
      </h3>
      {meta && (
        <span
          className="font-mono text-[9px] uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-3)' }}
        >
          {meta}
        </span>
      )}
    </div>
  );
}

function DatasetCard({ dataset }: { dataset: DatasetInfo }) {
  const quality = QUALITY_CONFIG[dataset.quality];
  return (
    <div
      className="relative overflow-hidden border transition-all duration-100 cursor-pointer"
      style={{
        background: 'var(--graphite-800)',
        borderColor: 'var(--graphite-400)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--graphite-400)';
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, var(--graphite-400) 20%, var(--graphite-400) 80%, transparent 100%)`,
        }}
      />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Database size={14} style={{ color: 'var(--text-2)' }} />
            <span
              className="font-mono text-[14px] font-bold"
              style={{ color: 'var(--text-1)' }}
            >
              {dataset.symbol}
            </span>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5"
              style={{
                color: 'var(--text-2)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {dataset.timeframe}
            </span>
          </div>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.05em] px-1.5 py-0.5"
            style={{
              color: quality.color,
              background: quality.bg,
              border: `1px solid ${quality.color}40`,
            }}
          >
            {quality.label}
          </span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'BARS', value: dataset.barCount.toLocaleString(), icon: BarChart3 },
            { label: 'SPREAD', value: `${dataset.avgSpread.toFixed(1)}p`, icon: SpreadIcon },
            { label: 'GAPS', value: dataset.gaps.toString(), icon: AlertTriangle },
            { label: 'RANGE', value: `${dataset.startDate.slice(0, 4)}-${dataset.endDate.slice(0, 4)}`, icon: Clock },
          ].map((m) => (
            <div key={m.label}>
              <span
                className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
                style={{ color: 'var(--text-3)' }}
              >
                {m.label}
              </span>
              <span
                className="font-mono text-[12px] tabular-nums"
                style={{ color: 'var(--text-1)' }}
              >
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpreadIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function DataPipelinePanel() {
  const [datasets, setDatasets] = useState<DatasetInfo[]>(MOCK_DATASETS);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // File upload handling will connect to API
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadProgress(0);
      // Simulate progress for now
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setUploadProgress(null), 1000);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  }, []);

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
          Historical Data Pipeline
        </h2>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.08em]"
          style={{ color: 'var(--text-3)' }}
        >
          {datasets.length} DATASETS LOADED
        </span>
      </div>

      {/* Upload zone */}
      <div
        className="relative overflow-hidden border-2 border-dashed transition-all duration-150"
        style={{
          background: isDragging ? 'rgba(255,255,255,0.03)' : 'var(--graphite-800)',
          borderColor: isDragging ? 'var(--text-2)' : 'var(--graphite-400)',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload
            size={24}
            className="mx-auto mb-3"
            style={{ color: isDragging ? 'var(--text-1)' : 'var(--text-3)' }}
          />
          <p
            className="font-mono text-[11px] uppercase tracking-[0.08em] mb-1"
            style={{ color: 'var(--text-2)' }}
          >
            {isDragging ? 'DROP MT5 CSV FILE' : 'DRAG MT5 CSV / TICK DATA'}
          </p>
          <p
            className="font-mono text-[9px] tracking-[0.05em]"
            style={{ color: 'var(--text-3)' }}
          >
            Supports: MT5 CSV export, 1M/5M/15M/1H/4H/1D bars, tick data
          </p>

          {uploadProgress !== null && (
            <div className="mt-4 max-w-xs mx-auto">
              <div
                className="h-1 w-full"
                style={{ background: 'var(--graphite-600)' }}
              >
                <div
                  className="h-1 transition-all duration-200"
                  style={{
                    width: `${uploadProgress}%`,
                    background: uploadProgress === 100 ? 'var(--neon)' : 'var(--text-1)',
                    boxShadow: uploadProgress === 100
                      ? '0 0 8px var(--neon)'
                      : '0 0 4px rgba(255,255,255,0.3)',
                  }}
                />
              </div>
              <span
                className="font-mono text-[9px] tabular-nums mt-1 block"
                style={{
                  color: uploadProgress === 100 ? 'var(--neon)' : 'var(--text-2)',
                }}
              >
                {uploadProgress === 100 ? 'UPLOAD COMPLETE' : `${uploadProgress}%`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dataset grid */}
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
        <SectionHeader
          title="LOADED DATASETS"
          meta={`${datasets.reduce((acc, d) => acc + d.barCount, 0).toLocaleString()} TOTAL BARS`}
        />
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {datasets.map((ds) => (
            <DatasetCard key={ds.id} dataset={ds} />
          ))}
        </div>
      </div>

      {/* Data Quality Summary */}
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
        <SectionHeader title="DATA QUALITY REPORT" />
        <div className="p-4">
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'TOTAL SYMBOLS', value: '3', color: 'var(--text-1)' },
              { label: 'TIMEFRAMES', value: '1H', color: 'var(--text-1)' },
              { label: 'DATE RANGE', value: '2022–2025', color: 'var(--text-1)' },
              { label: 'CLEAN SETS', value: '2/3', color: 'var(--neon)' },
              { label: 'TOTAL GAPS', value: '12', color: 'var(--amber)' },
            ].map((m) => (
              <div key={m.label}>
                <span
                  className="block font-mono text-[9px] uppercase tracking-[0.1em] mb-1"
                  style={{ color: 'var(--text-3)' }}
                >
                  {m.label}
                </span>
                <span
                  className="font-mono text-[16px] font-bold tabular-nums"
                  style={{ color: m.color }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
