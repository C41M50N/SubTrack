import { describe, expect, it } from 'vitest';

import { TERMINAL_END, TERMINAL_PROMPT, buildTerminalTimeline } from './terminal-timeline';

describe('buildTerminalTimeline', () => {
  it('ends on the final terminal state', () => {
    const steps = buildTerminalTimeline();

    expect(steps.at(-1)?.frame).toEqual(TERMINAL_END);
  });

  it('types one character per step, 22 to 40ms apart', () => {
    const keystrokes = buildTerminalTimeline().filter(
      ({ frame }, index, steps) => frame.typed !== (steps[index - 1]?.frame.typed ?? 0),
    );

    expect(keystrokes.map(({ frame }) => frame.typed)).toEqual(
      Array.from({ length: TERMINAL_PROMPT.length }, (_, index) => index + 1),
    );

    for (let index = 1; index < keystrokes.length; index += 1) {
      const gap = keystrokes[index].at - keystrokes[index - 1].at;

      expect(gap).toBeGreaterThanOrEqual(22);
      expect(gap).toBeLessThanOrEqual(40);
    }
  });

  it('starts typing after a 400ms hold', () => {
    const steps = buildTerminalTimeline();
    const firstKeystroke = steps.find(({ frame }) => frame.typed === 1);

    expect(steps[0]).toEqual({
      at: 0,
      frame: expect.objectContaining({ typed: 0, caret: 'blinking' }),
    });
    expect(firstKeystroke?.at).toBe(400);
  });

  it('runs the tool calls one after another, then shows the answer', () => {
    const steps = buildTerminalTimeline(() => 0.5);
    const lastKeystroke = steps.find(({ frame }) => frame.typed === TERMINAL_PROMPT.length);
    const firstCall = steps.find(({ frame }) => frame.toolCalls[0] === 'running');
    const secondCall = steps.find(({ frame }) => frame.toolCalls[1] === 'running');
    const answer = steps.find(({ frame }) => frame.answer);

    expect(firstCall?.frame.caret).toBe('hidden');
    expect(firstCall!.at - lastKeystroke!.at).toBe(300);
    expect(secondCall!.at - firstCall!.at).toBe(500);
    expect(secondCall?.frame.toolCalls[0]).toBe('done');
    expect(answer!.at - secondCall!.at).toBe(700);
  });

  it('takes about 3.5 seconds', () => {
    const fastest = buildTerminalTimeline(() => 0).at(-1)!.at;
    const slowest = buildTerminalTimeline(() => 1).at(-1)!.at;

    expect(fastest).toBeGreaterThan(2900);
    expect(slowest).toBeLessThan(4000);
  });
});
