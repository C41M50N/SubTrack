import { useEffect, useRef, useState } from 'react';

import {
  type TerminalFrame,
  TERMINAL_END,
  TERMINAL_PROMPT,
  TERMINAL_START,
  buildTerminalTimeline,
} from '@/features/landing/terminal-timeline';
import { type RevealState, useRevealOnce } from '@/hooks/use-reveal-once';
import { cn } from '@/lib/utils';

const TOOL_CALLS = [
  'list_upcoming_invoices(days: 7)',
  'get_cost_summary(collection: "Personal")',
];

const RENEWALS = [
  { name: 'Vercel', date: 'Tue, Oct 6', amount: '$20.00' },
  { name: 'Grammarly', date: 'Tue, Oct 6', amount: '$12.00' },
  { name: 'Perplexity Pro', date: 'Fri, Oct 9', amount: '$20.00' },
  { name: 'Notion', date: 'Sun, Oct 11', amount: '$10.00' },
];

/**
 * A Claude session answering a question through the EverySub MCP server. The
 * full transcript is always laid out, so the window never changes height;
 * the first time it scrolls into view, the question types itself out and the
 * rest fades in turn.
 */
export function McpTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const reveal = useRevealOnce(ref, { threshold: 0.5 });
  const frame = useTerminalFrame(reveal);

  return (
    <div
      ref={ref}
      data-reveal={reveal}
      className="flex flex-col overflow-clip rounded-2xl border border-white/8 bg-[#0B0D10] font-mono shadow-[0_30px_60px_-20px_#00000080] lg:grow lg:basis-0"
    >
      <div className="flex h-10.5 shrink-0 items-center gap-3.5 border-b border-white/6 px-4">
        <div aria-hidden className="flex gap-1.75">
          <span className="size-2.5 rounded-full bg-[#2A2F36]" />
          <span className="size-2.5 rounded-full bg-[#2A2F36]" />
          <span className="size-2.5 rounded-full bg-[#2A2F36]" />
        </div>
        <p className="text-xs/4 text-[#6B7580]">
          claude — connected to everysub
        </p>
      </div>
      <div className="flex flex-col gap-4.5 px-4 pt-5 pb-6 sm:px-6 sm:pt-6 sm:pb-7">
        <p className="flex gap-2.5 rounded-[10px] bg-[#161A1F] px-3.5 py-3 text-sm/5.5">
          <span aria-hidden className="font-medium text-brand-bright">
            &gt;
          </span>
          <span className="grid text-[#F1F4F7]">
            <span className="sr-only">{TERMINAL_PROMPT}</span>
            {/* Holds the line's full width and height while it types. */}
            <span aria-hidden className="invisible col-start-1 row-start-1">
              {TERMINAL_PROMPT}
            </span>
            <span aria-hidden className="col-start-1 row-start-1">
              {TERMINAL_PROMPT.slice(0, frame.typed)}
              {frame.caret !== 'hidden' && (
                <span
                  className={cn(
                    'ml-px inline-block h-4 w-2 bg-brand-bright align-[-3px]',
                    frame.caret === 'blinking' &&
                      'motion-safe:animate-terminal-caret',
                  )}
                />
              )}
            </span>
          </span>
        </p>
        <ul className="flex flex-col gap-1.5 text-[13px]/5 text-[#6B7580]">
          {TOOL_CALLS.map((call, index) => {
            const status = frame.toolCalls[index];

            return (
              <li
                key={call}
                data-status={status}
                className="transition-opacity duration-200 ease-reveal data-[status=hidden]:opacity-0"
              >
                <span
                  aria-hidden
                  className={cn(
                    status === 'running' && 'motion-safe:animate-dot-pulse',
                  )}
                >
                  ●
                </span>{' '}
                everysub · {call}
              </li>
            );
          })}
        </ul>
        <div
          data-status={frame.answer ? 'shown' : 'hidden'}
          className="flex flex-col gap-3.5 text-[13px]/5.5 text-[#E4E8EC] transition-[opacity,translate] duration-300 ease-reveal data-[status=hidden]:translate-y-1 data-[status=hidden]:opacity-0 sm:text-sm/5.5"
        >
          <p>Four renewals this week, $62.00 in total:</p>
          <ul className="flex flex-col gap-1 border-l-2 border-[#23282F] pl-3.5 text-[#F1F4F7]">
            {RENEWALS.map((renewal) => (
              <li key={renewal.name} className="flex">
                <span className="min-w-0 grow sm:w-37.5 sm:shrink-0 sm:grow-0">
                  {renewal.name}
                </span>
                <span className="w-[12ch] shrink-0 text-[#8A949F] sm:w-27.5">
                  {renewal.date}
                </span>
                <span className="w-[6ch] shrink-0 text-right sm:w-20">
                  {renewal.amount}
                </span>
              </li>
            ))}
          </ul>
          <p>
            Your yearly total is $4,876.70 across 30 subscriptions. These are
            expected charges, not confirmed payments.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Steps through the timeline once the terminal is revealed. */
function useTerminalFrame(reveal: RevealState): TerminalFrame {
  const [frame, setFrame] = useState(TERMINAL_START);

  useEffect(() => {
    if (reveal !== 'in') {
      return;
    }

    const timers = buildTerminalTimeline().map((step) =>
      window.setTimeout(() => setFrame(step.frame), step.at),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reveal]);

  return reveal === 'static' ? TERMINAL_END : frame;
}
