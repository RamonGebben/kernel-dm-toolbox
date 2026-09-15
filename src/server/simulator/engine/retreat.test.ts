import { describe, expect, it } from 'vitest';
import { shouldRetreat } from '~/server/simulator/engine/retreat';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';

describe('shouldRetreat', () => {
  it('is false above the HP threshold', () => {
    const self = buildCombatant({ maxHitPoints: 20, currentHitPoints: 6 });
    expect(shouldRetreat(self)).toBe(false);
  });

  it('is true at or below a quarter of max HP', () => {
    const self = buildCombatant({ maxHitPoints: 20, currentHitPoints: 5 });
    expect(shouldRetreat(self)).toBe(true);
  });

  it('is false once already defeated', () => {
    const self = buildCombatant({ maxHitPoints: 20, currentHitPoints: 0 });
    expect(shouldRetreat(self)).toBe(false);
  });

  it('is false with no speed to retreat with', () => {
    const self = buildCombatant({
      maxHitPoints: 20,
      currentHitPoints: 1,
      speed: 0,
    });
    expect(shouldRetreat(self)).toBe(false);
  });
});
