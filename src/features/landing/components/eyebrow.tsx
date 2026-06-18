import type { ReactNode } from 'react';
import { cn } from '@/utils';

type EyebrowProps = {
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
};

/**
 * Small uppercase kicker label that sits above a section heading to add
 * hierarchy and rhythm. Works on both light and dark (inverted) sections.
 */
export function Eyebrow({ children, className, tone = 'light' }: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-medium text-xs uppercase tracking-[0.2em]',
        tone === 'light' ? 'text-brand-600' : 'text-brand-200',
        className
      )}
    >
      {children}
    </span>
  );
}
