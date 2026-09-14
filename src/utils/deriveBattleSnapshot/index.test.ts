import { describe, expect, it } from 'vitest';
import { deriveBattleSnapshot } from '~/utils/deriveBattleSnapshot';
import type { TurnLogEntry } from '~/server/simulator/engine/types';
import type { BattleStartCombatant } from '~/server/simulator/battleStreamTypes';

const initial: BattleStartCombatant[] = [
  {
    id: 'a1',
    name: 'Fighter',
    side: 'party',
    position: { x: 0, y: 0 },
    maxHitPoints: 20,
  },
  {
    id: 'm1',
    name: 'Goblin',
    side: 'monsters',
    position: { x: 5, y: 0 },
    maxHitPoints: 7,
  },
];

describe('deriveBattleSnapshot', () => {
  it('returns starting positions and full HP with no entries revealed', () => {
    const snapshot = deriveBattleSnapshot(initial, []);

    expect(snapshot).toEqual([
      {
        id: 'a1',
        name: 'Fighter',
        side: 'party',
        position: { x: 0, y: 0 },
        maxHitPoints: 20,
        currentHitPoints: 20,
        isDefeated: false,
      },
      {
        id: 'm1',
        name: 'Goblin',
        side: 'monsters',
        position: { x: 5, y: 0 },
        maxHitPoints: 7,
        currentHitPoints: 7,
        isDefeated: false,
      },
    ]);
  });

  it('applies a move entry to the mover only', () => {
    const entries: TurnLogEntry[] = [
      {
        kind: 'move',
        combatantId: 'a1',
        from: { x: 0, y: 0 },
        to: { x: 1, y: 0 },
      },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    expect(snapshot.find(c => c.id === 'a1')?.position).toEqual({ x: 1, y: 0 });
    expect(snapshot.find(c => c.id === 'm1')?.position).toEqual({ x: 5, y: 0 });
  });

  it('subtracts damage from a hit but not a miss', () => {
    const entries: TurnLogEntry[] = [
      {
        kind: 'attack',
        combatantId: 'a1',
        targetId: 'm1',
        actionName: 'Sword',
        attackRoll: 15,
        targetArmorClass: 13,
        hit: true,
        critical: false,
        damage: 5,
      },
      {
        kind: 'attack',
        combatantId: 'm1',
        targetId: 'a1',
        actionName: 'Bite',
        attackRoll: 2,
        targetArmorClass: 16,
        hit: false,
        critical: false,
        damage: 0,
      },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    expect(snapshot.find(c => c.id === 'm1')?.currentHitPoints).toBe(2);
    expect(snapshot.find(c => c.id === 'a1')?.currentHitPoints).toBe(20);
  });

  it('never drops HP below zero', () => {
    const entries: TurnLogEntry[] = [
      {
        kind: 'attack',
        combatantId: 'a1',
        targetId: 'm1',
        actionName: 'Sword',
        attackRoll: 20,
        targetArmorClass: 13,
        hit: true,
        critical: true,
        damage: 50,
      },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    expect(snapshot.find(c => c.id === 'm1')?.currentHitPoints).toBe(0);
  });

  it('applies damage to every target of a save-effect entry', () => {
    const entries: TurnLogEntry[] = [
      {
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
        ],
      },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    expect(snapshot.find(c => c.id === 'a1')?.currentHitPoints).toBe(10);
  });

  it('marks a defeated combatant and zeroes its HP', () => {
    const entries: TurnLogEntry[] = [
      { kind: 'defeated', combatantId: 'm1', name: 'Goblin' },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    const goblin = snapshot.find(c => c.id === 'm1');
    expect(goblin?.isDefeated).toBe(true);
    expect(goblin?.currentHitPoints).toBe(0);
  });

  it('ignores round-start, initiative, and no-action entries', () => {
    const entries: TurnLogEntry[] = [
      { kind: 'round-start', round: 1 },
      {
        kind: 'initiative',
        order: [{ combatantId: 'a1', name: 'Fighter', roll: 18 }],
      },
      { kind: 'no-action', combatantId: 'm1', reason: 'no-eligible-action' },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    expect(snapshot).toEqual(deriveBattleSnapshot(initial, []));
  });
});
