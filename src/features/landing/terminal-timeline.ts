export const TERMINAL_PROMPT = "What renews this week, and what's my yearly total?";

export type ToolCallStatus = 'hidden' | 'running' | 'done';

/** What the terminal shows at one moment of the sequence. */
export type TerminalFrame = {
  /** Characters of the prompt typed so far. */
  typed: number;
  /** Solid while keys are landing, blinking while idle. */
  caret: 'hidden' | 'blinking' | 'solid';
  toolCalls: readonly [ToolCallStatus, ToolCallStatus];
  answer: boolean;
};

export type TimelineStep = {
  /** Milliseconds after the sequence starts. */
  at: number;
  frame: TerminalFrame;
};

export const TERMINAL_START: TerminalFrame = {
  typed: 0,
  caret: 'hidden',
  toolCalls: ['hidden', 'hidden'],
  answer: false,
};

export const TERMINAL_END: TerminalFrame = {
  typed: TERMINAL_PROMPT.length,
  caret: 'hidden',
  toolCalls: ['done', 'done'],
  answer: true,
};

const CARET_HOLD_MS = 400;
const KEYSTROKE_MIN_MS = 22;
const KEYSTROKE_MAX_MS = 40;
const AFTER_TYPING_MS = 300;
const TOOL_CALL_MS = 500;
const BEFORE_ANSWER_MS = 200;

/**
 * Builds the MCP demo: the caret blinks, the question is typed with uneven
 * keystrokes, each tool call runs in turn, and then the answer appears. Takes
 * about 3.5 seconds, ending on `TERMINAL_END`.
 */
export function buildTerminalTimeline(random: () => number = Math.random): TimelineStep[] {
  const steps: TimelineStep[] = [];
  let at = 0;
  let frame = TERMINAL_START;

  const show = (changes: Partial<TerminalFrame>) => {
    frame = { ...frame, ...changes };
    steps.push({ at, frame });
  };

  show({ caret: 'blinking' });
  at += CARET_HOLD_MS;

  for (let typed = 1; typed <= TERMINAL_PROMPT.length; typed += 1) {
    if (typed > 1) {
      at += KEYSTROKE_MIN_MS + random() * (KEYSTROKE_MAX_MS - KEYSTROKE_MIN_MS);
    }

    show({ typed, caret: 'solid' });
  }

  show({ caret: 'blinking' });
  at += AFTER_TYPING_MS;
  show({ caret: 'hidden', toolCalls: ['running', 'hidden'] });
  at += TOOL_CALL_MS;
  show({ toolCalls: ['done', 'running'] });
  at += TOOL_CALL_MS;
  show({ toolCalls: ['done', 'done'] });
  at += BEFORE_ANSWER_MS;
  show({ answer: true });

  return steps;
}
