import clsx from 'clsx';
import { Status } from '../../lib/types';

interface StatusTagProps {
  status: Status;
}

export function StatusTag({ status }: StatusTagProps) {
  const styles = {
    WINNER: 'text-[var(--neon)] border-[var(--neon)] bg-[var(--neon-subtle)] shadow-[0_0_10px_var(--neon-glow)]',
    OPTIMIZE: 'text-[var(--amber)] border-[var(--amber)] bg-[var(--amber-subtle)] shadow-[0_0_10px_var(--amber-glow)]',
    RETEST: 'text-[var(--crimson)] border-[var(--crimson)] bg-[var(--crimson-subtle)] shadow-[0_0_10px_var(--crimson-glow)]',
  };

  return (
    <span
      className={clsx(
        'px-2 py-0.5 text-[10px] font-bold tracking-widest border uppercase rounded-sm inline-flex items-center gap-1.5',
        styles[status]
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", {
        'bg-[var(--neon)]': status === 'WINNER',
        'bg-[var(--amber)]': status === 'OPTIMIZE',
        'bg-[var(--crimson)]': status === 'RETEST',
      })} />
      {status}
    </span>
  );
}
