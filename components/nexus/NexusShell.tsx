'use client';

import { useState } from 'react';
import {
  Database, FlaskConical, Cpu, BrainCircuit, ShieldCheck,
  Activity, ChevronRight,
} from 'lucide-react';
import type { NexusTab } from '@/lib/nexus-types';
import { DataPipelinePanel } from './DataPipelinePanel';
import { BacktestPanel } from './BacktestPanel';
import { OptimizePanel } from './OptimizePanel';
import { RegimePanel } from './RegimePanel';
import { RobustnessPanel } from './RobustnessPanel';

const TABS: { id: NexusTab; label: string; icon: typeof Database }[] = [
  { id: 'DATA', label: 'DATA PIPELINE', icon: Database },
  { id: 'BACKTEST', label: 'BACKTEST', icon: FlaskConical },
  { id: 'OPTIMIZE', label: 'OPTIMIZE', icon: Cpu },
  { id: 'REGIME', label: 'REGIME ML', icon: BrainCircuit },
  { id: 'ROBUSTNESS', label: 'ROBUSTNESS', icon: ShieldCheck },
];

export function NexusShell() {
  const [activeTab, setActiveTab] = useState<NexusTab>('DATA');

  return (
    <div className="flex flex-col h-full">
      {/* Sub-navigation bar */}
      <div
        className="flex items-center gap-1 px-6 py-2 border-b"
        style={{
          background: 'var(--graphite-900)',
          borderColor: 'var(--graphite-400)',
        }}
      >
        <div className="flex items-center gap-2 mr-4">
          <Activity size={14} style={{ color: 'var(--neon)' }} />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.1em] font-bold"
            style={{ color: 'var(--text-1)' }}
          >
            NEXUS ENGINE
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5"
            style={{
              color: 'var(--violet)',
              background: 'rgba(167,139,250,0.1)',
              border: '1px solid rgba(167,139,250,0.25)',
            }}
          >
            BETA
          </span>
        </div>

        <ChevronRight size={12} style={{ color: 'var(--text-4)' }} />

        <div className="flex items-center gap-1 ml-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-all duration-100"
                style={{
                  background: isActive ? 'var(--text-1)' : 'transparent',
                  color: isActive ? 'var(--void)' : 'var(--text-3)',
                  border: `1px solid ${isActive ? 'var(--text-1)' : 'transparent'}`,
                  cursor: 'pointer',
                  boxShadow: isActive
                    ? '0 0 8px rgba(255,255,255,0.15)'
                    : 'none',
                }}
              >
                <Icon size={11} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Status indicators */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--neon)',
                boxShadow: '0 0 4px var(--neon), 0 0 8px var(--neon)',
                animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.08em]"
              style={{ color: 'var(--text-3)' }}
            >
              ENGINE READY
            </span>
          </div>
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-auto p-6" style={{ background: 'var(--void)' }}>
        <div className="max-w-[1600px] mx-auto">
          {activeTab === 'DATA' && <DataPipelinePanel />}
          {activeTab === 'BACKTEST' && <BacktestPanel />}
          {activeTab === 'OPTIMIZE' && <OptimizePanel />}
          {activeTab === 'REGIME' && <RegimePanel />}
          {activeTab === 'ROBUSTNESS' && <RobustnessPanel />}
        </div>
      </div>
    </div>
  );
}
