import { describe, expect, it } from 'vitest';
import { formatBattleLogEntry } from '~/utils/formatBattleLogEntry';
import type { TurnLogEntry } from '~/server/simulator/engine/types';

const names = new Map([
  ['a1', 'Fighter'],
  ['m1', 'Goblin #1'],
]);

describe('formatBattleLogEntry', () => {
  it('formats a round-start entry', () => {
    expect(formatBattleLogEntry({ kind: 'round-start', round: 3 }, names)).toBe(
      '— Round 3 —',
    );
  });

  it('formats an initiative entry from its own inline names', () => {
    const entry: TurnLogEntry = {
      kind: 'initiative',
      order: [
        { combatantId: 'a1', name: 'Fighter', roll: 18 },
        { combatantId: 'm1', name: 'Goblin #1', roll: 12 },
      ],
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Initiative: Fighter (18), Goblin #1 (12)',
    );
  });

  it('formats a move entry, resolving the name by id', () => {
    const entry: TurnLogEntry = {
      kind: 'move',
      combatantId: 'a1',
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
    };

    expect(formatBattleLogEntry(entry, names)).toBe('Fighter moves.');
  });

  it('formats a hit', () => {
    const entry: TurnLogEntry = {
      kind: 'attack',
      combatantId: 'a1',
      targetId: 'm1',
      actionName: 'Longsword',
      attackRoll: 17,
      targetArmorClass: 13,
      hit: true,
      critical: false,
      damage: 7,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter attacks Goblin #1 with Longsword: hits for 7 damage.',
    );
  });

  it('formats a critical hit', () => {
    const entry: TurnLogEntry = {
      kind: 'attack',
      combatantId: 'a1',
      targetId: 'm1',
      actionName: 'Longsword',
      attackRoll: 20,
      targetArmorClass: 13,
      hit: true,
      critical: true,
      damage: 14,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter attacks Goblin #1 with Longsword: hits for 14 damage (critical hit!).',
    );
  });

  it('formats a miss', () => {
    const entry: TurnLogEntry = {
      kind: 'attack',
      combatantId: 'a1',
      targetId: 'm1',
      actionName: 'Longsword',
      attackRoll: 4,
      targetArmorClass: 13,
      hit: false,
      critical: false,
      damage: 0,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter attacks Goblin #1 with Longsword: misses (rolled 4 vs AC 13).',
    );
  });

  it('formats a save-effect entry with a mix of outcomes', () => {
    const entry: TurnLogEntry = {
      kind: 'save-effect',
      combatantId: 'm1',
      actionName: 'Fire Breath',
      saveDc: 15,
      targets: [
        {
          targetId: 'a1',
          saveRoll: 8,
          succeeded: false,
          usedLegendaryResistance: false,
          damage: 22,
        },
      ],
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Goblin #1 uses Fire Breath (DC 15): Fighter fails the save for 22 damage.',
    );
  });

  it('formats a defeated entry from its own inline name', () => {
    expect(
      formatBattleLogEntry(
        { kind: 'defeated', combatantId: 'm1', name: 'Goblin #1' },
        names,
      ),
    ).toBe('Goblin #1 is defeated!');
  });

  it('formats a no-action entry', () => {
    expect(
      formatBattleLogEntry(
        { kind: 'no-action', combatantId: 'a1', reason: 'no-living-enemies' },
        names,
      ),
    ).toBe('Fighter has nothing to do (no living enemies).');
  });

  it('formats a condition-applied entry with a save-ends duration and the source', () => {
    const entry: TurnLogEntry = {
      kind: 'condition-applied',
      combatantId: 'a1',
      conditionKey: 'frightened',
      sourceCombatantId: 'm1',
      roundsRemaining: null,
      saveEndsEachTurn: true,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter is now Frightened (save ends) (caused by Goblin #1).',
    );
  });

  it('formats a condition-applied entry with a fixed round count', () => {
    const entry: TurnLogEntry = {
      kind: 'condition-applied',
      combatantId: 'a1',
      conditionKey: 'stunned',
      sourceCombatantId: 'm1',
      roundsRemaining: 1,
      saveEndsEachTurn: false,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter is now Stunned (1 round) (caused by Goblin #1).',
    );
  });

  it('formats a condition-applied entry with no fixed end', () => {
    const entry: TurnLogEntry = {
      kind: 'condition-applied',
      combatantId: 'a1',
      conditionKey: 'prone',
      sourceCombatantId: 'm1',
      roundsRemaining: null,
      saveEndsEachTurn: false,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter is now Prone (caused by Goblin #1).',
    );
  });

  it('formats a condition-removed entry for each reason', () => {
    const base = {
      kind: 'condition-removed' as const,
      combatantId: 'a1',
      conditionKey: 'frightened',
    };

    expect(
      formatBattleLogEntry({ ...base, reason: 'expired' }, names),
    ).toBe("Fighter's Frightened wears off.");
    expect(
      formatBattleLogEntry({ ...base, reason: 'save-succeeded' }, names),
    ).toBe("Fighter's Frightened is shaken off.");
    expect(
      formatBattleLogEntry({ ...base, reason: 'concentration-broken' }, names),
    ).toBe("Fighter's Frightened ends (concentration broken).");
  });

  it('formats a concentration-check entry for success and failure', () => {
    const base = {
      kind: 'concentration-check' as const,
      combatantId: 'a1',
      damage: 12,
      dc: 10,
    };

    expect(
      formatBattleLogEntry({ ...base, roll: 15, succeeded: true }, names),
    ).toBe('Fighter maintains concentration (rolled 15 vs DC 10).');
    expect(
      formatBattleLogEntry({ ...base, roll: 4, succeeded: false }, names),
    ).toBe('Fighter loses concentration (rolled 4 vs DC 10).');
  });

  it('formats a down entry from its own inline name', () => {
    expect(
      formatBattleLogEntry({ kind: 'down', combatantId: 'a1', name: 'Fighter' }, names),
    ).toBe('Fighter drops to 0 HP and is dying!');
  });

  it('formats a rolled death-save success and failure', () => {
    const base = { kind: 'death-save' as const, combatantId: 'a1' };

    expect(
      formatBattleLogEntry(
        {
          ...base,
          roll: 14,
          failuresAdded: 0,
          isNatural20: false,
          successes: 1,
          failures: 0,
        },
        names,
      ),
    ).toBe('Fighter succeeds on a death save (rolled 14): 1 successes, 0 failures.');

    expect(
      formatBattleLogEntry(
        {
          ...base,
          roll: 6,
          failuresAdded: 1,
          isNatural20: false,
          successes: 0,
          failures: 1,
        },
        names,
      ),
    ).toBe('Fighter fails a death save (rolled 6): 0 successes, 1 failures.');
  });

  it('formats a natural-1 death save as a double failure', () => {
    const entry: TurnLogEntry = {
      kind: 'death-save',
      combatantId: 'a1',
      roll: 1,
      failuresAdded: 2,
      isNatural20: false,
      successes: 0,
      failures: 2,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter fails a death save (rolled 1 (natural 1, counts as two)): 0 successes, 2 failures.',
    );
  });

  it('formats a natural-20 death save as reviving', () => {
    const entry: TurnLogEntry = {
      kind: 'death-save',
      combatantId: 'a1',
      roll: 20,
      failuresAdded: 0,
      isNatural20: true,
      successes: 1,
      failures: 0,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter rolls a natural 20 on their death save and returns to consciousness!',
    );
  });

  it('formats an automatic death-save failure from taking damage at 0 HP', () => {
    const entry: TurnLogEntry = {
      kind: 'death-save',
      combatantId: 'a1',
      roll: null,
      failuresAdded: 2,
      isNatural20: false,
      successes: 0,
      failures: 2,
    };

    expect(formatBattleLogEntry(entry, names)).toBe(
      'Fighter takes damage at 0 HP: 2 automatic death save failures (0 successes, 2 failures).',
    );
  });

  it('formats a stabilized entry', () => {
    expect(
      formatBattleLogEntry({ kind: 'stabilized', combatantId: 'a1' }, names),
    ).toBe('Fighter stabilizes.');
  });

  it('formats a revived entry', () => {
    expect(
      formatBattleLogEntry(
        { kind: 'revived', combatantId: 'a1', hitPoints: 1 },
        names,
      ),
    ).toBe('Fighter regains consciousness with 1 HP!');
  });

  it('falls back to a placeholder for an unknown id', () => {
    const entry: TurnLogEntry = {
      kind: 'move',
      combatantId: 'ghost',
      from: { x: 0, y: 0 },
      to: { x: 1, y: 0 },
    };

    expect(formatBattleLogEntry(entry, names)).toBe('Unknown combatant moves.');
  });
});
