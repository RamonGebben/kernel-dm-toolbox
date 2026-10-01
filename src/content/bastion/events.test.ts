import { describe, expect, it } from 'vitest';
import { bastionEvents, treasureRows } from '~/content/bastion/events';

/** Every d100 result must land on exactly one row. */
const coversOneToHundred = (rows: readonly { from: number; to: number }[]) =>
  Array.from({ length: 100 }, (_, index) => index + 1).every(
    roll => rows.filter(row => roll >= row.from && roll <= row.to).length === 1,
  );

describe('bastion event tables', () => {
  it('covers every d100 result exactly once', () => {
    expect(coversOneToHundred(bastionEvents)).toBe(true);
  });

  it('covers every treasure roll exactly once', () => {
    expect(coversOneToHundred(treasureRows)).toBe(true);
  });

  it('has eleven events with unique keys', () => {
    expect(new Set(bastionEvents.map(event => event.key)).size).toBe(11);
  });
});
