import { describe, expect, it } from 'vitest';
import { highlightedCombatantIdsForEntry } from '~/utils/highlightedCombatantIdsForEntry';
import type { TurnLogEntry } from '~/server/simulator/engine/types';

describe('highlightedCombatantIdsForEntry', () => {
  it('returns nothing for null', () => {
    expect(highlightedCombatantIdsForEntry(null)).toEqual([]);
  });

  it('returns the actor for a move/defeated/no-action entry', () => {
    const move: TurnLogEntry = {
      kind: 'move',
      combatantId: 'a1',
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
    };
    expect(highlightedCombatantIdsForEntry(move)).toEqual(['a1']);

    expect(
      highlightedCombatantIdsForEntry({
        kind: 'defeated',
        combatantId: 'm1',
        name: 'Goblin',
      }),
    ).toEqual(['m1']);

    expect(
      highlightedCombatantIdsForEntry({
        kind: 'no-action',
        combatantId: 'a1',
        reason: 'no-eligible-action',
      }),
    ).toEqual(['a1']);
  });

  it('returns actor and target for an attack entry', () => {
    const entry: TurnLogEntry = {
      kind: 'attack',
      combatantId: 'a1',
      targetId: 'm1',
      actionName: 'Sword',
      attackRoll: 15,
      targetArmorClass: 13,
      hit: true,
      critical: false,
      damage: 5,
    };
    expect(highlightedCombatantIdsForEntry(entry)).toEqual(['a1', 'm1']);
  });

  it('returns actor and every target for a save-effect entry', () => {
    const entry: TurnLogEntry = {
      kind: 'save-effect',
      combatantId: 'm1',
      actionName: 'Breath',
      saveDc: 15,
      targets: [
        {
          targetId: 'a1',
          saveRoll: 8,
          succeeded: false,
          usedLegendaryResistance: false,
          damage: 10,
        },
        {
          targetId: 'a2',
          saveRoll: 18,
          succeeded: true,
          usedLegendaryResistance: false,
          damage: 5,
        },
      ],
    };
    expect(highlightedCombatantIdsForEntry(entry)).toEqual(['m1', 'a1', 'a2']);
  });

  it('returns nothing for round-start/initiative entries', () => {
    expect(
      highlightedCombatantIdsForEntry({ kind: 'round-start', round: 1 }),
    ).toEqual([]);
    expect(
      highlightedCombatantIdsForEntry({
        kind: 'initiative',
        order: [{ combatantId: 'a1', name: 'Fighter', roll: 18 }],
      }),
    ).toEqual([]);
  });
});
