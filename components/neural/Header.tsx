import Link from 'next/link';

export function Header() {
  return (
    <header className="flex items-center justify-between mb-8 neural-panel px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_var(--neon-glow)]">
            <polygon points="50,10 90,90 10,90" 
                     fill="none" 
                     stroke="var(--neon)" 
                     strokeWidth="4"/>
            <polygon points="50,35 70,75 30,75" 
                     fill="var(--neon)"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-[0.2em] text-[var(--text-1)] text-glow-neon">
            DIVERSIFY
          </h1>
          <p className="text-[10px] text-[var(--text-3)] tracking-widest uppercase mt-0.5">
            Algorithmic Intelligence Unit
          </p>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-widest uppercase text-[var(--text-2)]">
        <Link href="#" className="hover:text-[var(--neon)] transition-colors text-glow-neon">Dashboard</Link>
        <Link href="#" className="hover:text-[var(--neon)] transition-colors">Backtests</Link>
        <Link href="#" className="hover:text-[var(--neon)] transition-colors">Live Trading</Link>
        <Link href="#" className="hover:text-[var(--neon)] transition-colors">Settings</Link>
      </nav>

      <div className="flex items-center gap-4 text-[10px] tracking-wider text-[var(--neon)]">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--neon)] animate-pulse shadow-[0_0_8px_var(--neon)]"></span>
          SYSTEM ONLINE
        </span>
        <span className="text-[var(--text-3)]">|</span>
        <span className="tabular-nums font-mono text-[var(--text-2)]">
          {new Date().toISOString().split('T')[0]}
        </span>
      </div>
    </header>
  );
}
