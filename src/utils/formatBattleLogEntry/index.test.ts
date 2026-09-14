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
