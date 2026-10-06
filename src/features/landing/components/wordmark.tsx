import { cn } from '@/lib/utils';

/** The EverySub logo beside its name. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <img src="/favicon.svg" alt="" className="size-7" />
      <span className="text-lg/5.5 font-semibold tracking-[-0.02em]">
        EverySub
      </span>
    </span>
  );
}
