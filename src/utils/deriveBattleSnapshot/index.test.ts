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
        isDown: false,
        isStabilized: false,
        activeConditionKeys: [],
      },
      {
        id: 'm1',
        name: 'Goblin',
        side: 'monsters',
        position: { x: 5, y: 0 },
        maxHitPoints: 7,
        currentHitPoints: 7,
        isDefeated: false,
        isDown: false,
        isStabilized: false,
        activeConditionKeys: [],
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

  it('ignores round-start, initiative, no-action, death-save, and concentration-check entries', () => {
    const entries: TurnLogEntry[] = [
      { kind: 'round-start', round: 1 },
      {
        kind: 'initiative',
        order: [{ combatantId: 'a1', name: 'Fighter', roll: 18 }],
      },
      { kind: 'no-action', combatantId: 'm1', reason: 'no-eligible-action' },
      {
        kind: 'death-save',
        combatantId: 'a1',
        roll: 14,
        failuresAdded: 0,
        isNatural20: false,
        successes: 1,
        failures: 0,
      },
      {
        kind: 'concentration-check',
        combatantId: 'a1',
        damage: 5,
        dc: 10,
        roll: 15,
        succeeded: true,
      },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    expect(snapshot).toEqual(deriveBattleSnapshot(initial, []));
  });

  it('marks a combatant down without defeating it, then clears it on revived', () => {
    const downEntries: TurnLogEntry[] = [
      { kind: 'down', combatantId: 'a1', name: 'Fighter' },
    ];

    const down = deriveBattleSnapshot(initial, downEntries);
    const fighterDown = down.find(c => c.id === 'a1');
    expect(fighterDown?.isDown).toBe(true);
    expect(fighterDown?.isDefeated).toBe(false);

    const revivedEntries: TurnLogEntry[] = [
      ...downEntries,
      { kind: 'revived', combatantId: 'a1', hitPoints: 1 },
    ];
    const revived = deriveBattleSnapshot(initial, revivedEntries);
    const fighterRevived = revived.find(c => c.id === 'a1');
    expect(fighterRevived?.isDown).toBe(false);
    expect(fighterRevived?.currentHitPoints).toBe(1);
  });

  it('marks a combatant stabilized while keeping isDown true', () => {
    const entries: TurnLogEntry[] = [
      { kind: 'down', combatantId: 'a1', name: 'Fighter' },
      { kind: 'stabilized', combatantId: 'a1' },
    ];

    const snapshot = deriveBattleSnapshot(initial, entries);
    const fighter = snapshot.find(c => c.id === 'a1');
    expect(fighter?.isDown).toBe(true);
    expect(fighter?.isStabilized).toBe(true);
  });

  it('tracks active conditions being applied and removed', () => {
    const applied: TurnLogEntry[] = [
      {
        kind: 'condition-applied',
        combatantId: 'a1',
        conditionKey: 'frightened',
        sourceCombatantId: 'm1',
        roundsRemaining: null,
        saveEndsEachTurn: true,
      },
    ];
    expect(
      deriveBattleSnapshot(initial, applied).find(c => c.id === 'a1')
        ?.activeConditionKeys,
    ).toEqual(['frightened']);

    const removed: TurnLogEntry[] = [
      ...applied,
      {
        kind: 'condition-removed',
        combatantId: 'a1',
        conditionKey: 'frightened',
        reason: 'save-succeeded',
      },
    ];
    expect(
      deriveBattleSnapshot(initial, removed).find(c => c.id === 'a1')
        ?.activeConditionKeys,
    ).toEqual([]);
  });
});
