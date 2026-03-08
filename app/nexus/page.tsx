'use client';

import { NexusShell } from 'A/components/nexus/NexusShell';
import { useAuth } from 'A/lib/hooks/useAuth';

export default function NexusPage() {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[var(--void)]">
        <div className="w-5 h-5 border border-[var(--neon)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{
        background: 'var(--void)',
        fontFamily: "Inter, -apple-system, system-ui, 'Segoe UI', sans-serif",
      }}
    >
      {/* Top nav bar */}
      <nav
        className="flex items-center justify-between px-6 shrink-0 border-b"
        style={{
          height: 44,
          background: 'var(--graphite-900)',
          borderColor: 'var(--graphite-400)',
        }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <svg width="20" height="24" viewBox="0 0 48 60">
            <path
              d="M16,10 L30,1 L33,26 L37,22 L39,28 L35,33 L29,40 L19,50 L10,58 L18,42 L22,34 L8,36 Z"
              fill="#ffffff"
            />
            <path d="M8,20 L18,8 L21,28 L10,33 Z" fill="var(--void)" opacity="0.6" />
            <path d="M12,18 L22,6 L24,28 L14,33 Z" fill="var(--void)" opacity="0.35" />
          </svg>
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[0.15em]"
            style={{ color: 'var(--text-1)' }}
          >
            DYVERSIFY
          </span>
        </div>

        {/* Center: Zone tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: 'dashboard', label: '1 DASHBOARD', href: '/' },
            { id: 'strategies', label: '2 STRATEGIES' },
            { id: 'analysis', label: '3 ANALYSIS' },
            { id: 'nexus', label: '4 NEXUS ENGINE', active: true },
            { id: 'settings', label: '5 SETTINGS' },
          ].map((tab) => (
            <a
              key={tab.id}
              href={tab.href || '#'}
              className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.05em] transition-all duration-100"
              style={{
                background: tab.active ? 'var(--text-1)' : 'transparent',
                color: tab.active ? 'var(--void)' : 'var(--text-3)',
                border: `1px solid ${tab.active ? 'var(--text-1)' : 'transparent'}`,
                boxShadow: tab.active ? '0 0 8px rgba(255,255,255,0.15)' : 'none',
                textDecoration: 'none',
              }}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: 'var(--neon)',
                boxShadow: '0 0 4px var(--neon), 0 0 8px var(--neon)] 
                animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.08em]"
              style={{ color: 'var(--text-3)' }}
            >
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </nav>

      {/* Content area */}
      <main className="flex-1 overflow-hidden">
        <NexusShell />
      </main>

      {/* Bottom status bar */}
      <div
        className="flex items-center justify-between px-6 shrink-0 border-t"
        style={{
          height: 28,
          background: 'var(--graphite-900)',
          borderColor: 'var(--graphite-400)',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-3)' }}>
            NEXUS ENGINE v0.1.0-alpha
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.08em]" style={{ color: 'var(--text-3)' }}>
            PYTHON BACKEND: CONNECTED
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] tabular-nums" style={{ color: 'var(--text-4)' }}>
            CPU — | MEM — | BRANCH: feature/nexus-engine
          </span>
        </div>
      </div>

      {/* Dot grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #2a2a2a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.12,
          zIndex: 0,
        }}
      />

      {/* Scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)`,
          opacity: 0.3,
          zIndex: 100,
        }}
      />
    </div>
  