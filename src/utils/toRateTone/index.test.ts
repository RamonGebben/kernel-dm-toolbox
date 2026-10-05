import { describe, expect, it } from 'vitest';
import { toKillRateTone, toRateTone } from '~/utils/toRateTone';

describe('toRateTone', () => {
  it('reads a high rate as good', () => {
    expect(toRateTone(0.8)).toBe('good');
  });

  it('reads a mid rate as warning', () => {
    expect(toRateTone(0.5)).toBe('warning');
  });

  it('reads a low rate as bad', () => {
    expect(toRateTone(0.1)).toBe('bad');
  });

  it('inverts the banding when a high rate is actually bad', () => {
    expect(toRateTone(0.8, { invert: true })).toBe('bad');
    expect(toRateTone(0.1, { invert: true })).toBe('good');
  });
});

describe('toKillRateTone', () => {
  it('reads zero kills as neutral, not bad', () => {
    expect(toKillRateTone(0)).toBe('neutral');
  });

  it('reads some kills as warning', () => {
    expect(toKillRateTone(0.5)).toBe('warning');
  });

  it('reads a full kill a trial or more as good', () => {
    expect(toKillRateTone(1)).toBe('good');
    expect(toKillRateTone(2.3)).toBe('good');
  });
});
