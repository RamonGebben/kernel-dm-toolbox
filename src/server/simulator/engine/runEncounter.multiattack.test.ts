import { describe, expect, it } from 'vitest';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { aggregateBatchResults } from '~/server/simulator/engine/aggregateBatchResults';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type {
  EngineAction,
  TurnLogEntry,
} from '~/server/simulator/engine/types';

/** Resolved monster multiattack (issue #5, milestone 11): a real "Bite ×1,
 * Claw ×2" style sequence should resolve as three separate named attacks
 * against a monster's turn, not the flat one-attack-per-turn fallback every
 * monster had before this milestone (or still has once its own Multiattack
 * prose doesn't parse — see `resolveMultiattackSequence`'s own doc
 * comment in `loadScenarioCombatants.ts`). */

const guaranteedHitNoDamage = (id: string, name: string): EngineAction => ({
  id,
  name,
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 100,
    reach: 5,
    range: null,
    damageDieCount: 0,
    damageDieType: 6,
    damageBonus: 0,
    damageType: 'slashing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
});

const lethalHit = (id: string, name: string): EngineAction => ({
  ...guaranteedHitNoDamage(id, name),
  attack: {
    ...guaranteedHitNoDamage(id, name).attack!,
    damageBonus: 50,
  },
});

const attackNames = (log: TurnLogEntry[]) =>
  log
    .filter(
      (entry): entry is Extract<TurnLogEntry, { kind: 'attack' }> =>
        entry.kind === 'attack',
    )
    .map(entry => entry.actionName);

describe('runEncounter multiattack', () => {
  it('resolves each named sub-attack in sequence, not a flat repeat', () => {
    const bite = guaranteedHitNoDamage('bite', 'Bite');
    const claw = guaranteedHitNoDamage('claw', 'Claw');

    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 0, y: 0 },
      actions: [bite, claw],
      multiattackSequence: [
        { actionId: 'bite', count: 1 },
        { actionId: 'claw', count: 2 },
      ],
    });
    const target = buildCombatant({
      id: 'target',
      side: 'party',
      position: { x: 1, y: 0 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      actions: [],
    });

    const result = runEncounter(
      { combatants: [monster, target], maxRounds: 1 },
      1,
    );

    expect(attackNames(result.log)).toEqual(['Bite', 'Claw', 'Claw']);
  });

  it('falls back to a single normal attack when multiattackSequence is null', () => {
    const bite = guaranteedHitNoDamage('bite', 'Bite');
    const claw = guaranteedHitNoDamage('claw', 'Claw');

    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 0, y: 0 },
      actions: [bite, claw],
      multiattackSequence: null,
    });
    const target = buildCombatant({
      id: 'target',
      side: 'party',
      position: { x: 1, y: 0 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      actions: [],
    });

    const result = runEncounter(
      { combatants: [monster, target], maxRounds: 1 },
      1,
    );

    expect(attackNames(result.log)).toHaveLength(1);
  });

  it('reselects a target via the normal targeting AI when the current one dies mid-sequence', () => {
    const claw = lethalHit('claw', 'Claw');

    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 0, y: 0 },
      actions: [claw],
      multiattackSequence: [{ actionId: 'claw', count: 3 }],
    });
    const frail = buildCombatant({
      id: 'frail',
      side: 'party',
      position: { x: 1, y: 0 },
      maxHitPoints: 1,
      currentHitPoints: 1,
      actions: [],
    });
    const sturdy = buildCombatant({
      id: 'sturdy',
      side: 'party',
      position: { x: 1, y: 1 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      actions: [],
    });

    const result = runEncounter(
      { combatants: [monster, frail, sturdy], maxRounds: 1 },
      1,
    );

    const attacks = result.log.filter(
      (entry): entry is Extract<TurnLogEntry, { kind: 'attack' }> =>
        entry.kind === 'attack',
    );
    expect(attacks).toHaveLength(3);
    expect(attacks[0]!.targetId).toBe('frail');
    // Once `frail` is defeated by the first Claw, the remaining two must
    // land on the only living enemy left.
    expect(attacks[1]!.targetId).toBe('sturdy');
    expect(attacks[2]!.targetId).toBe('sturdy');
  });

  it('skips a sequence entry whose actionId matches nothing on the combatant, without crashing', () => {
    const claw = guaranteedHitNoDamage('claw', 'Claw');

    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 0, y: 0 },
      actions: [claw],
      multiattackSequence: [
        { actionId: 'does-not-exist', count: 5 },
        { actionId: 'claw', count: 1 },
      ],
    });
    const target = buildCombatant({
      id: 'target',
      side: 'party',
      position: { x: 1, y: 0 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      actions: [],
    });

    const result = runEncounter(
      { combatants: [monster, target], maxRounds: 1 },
      1,
    );

    expect(attackNames(result.log)).toEqual(['Claw']);
  });

  it('deals more average damage per encounter than an equivalent flat single-attack monster', () => {
    const TRIAL_COUNT = 200;
    const runBatch = (
      actions: EngineAction[],
      multiattackSequence: { actionId: string; count: number }[] | null,
      baseSeed: number,
    ) => {
      const results = Array.from({ length: TRIAL_COUNT }, (_, index) => {
        const monster = buildCombatant({
          id: 'monster',
          templateKey: 'monster',
          side: 'monsters',
          position: { x: 0, y: 0 },
          armorClass: 10,
          actions,
          multiattackSequence,
        });
        const target = buildCombatant({
          id: 'target',
          templateKey: 'target',
          side: 'party',
          position: { x: 1, y: 0 },
          armorClass: 10,
          maxHitPoints: 999999,
          currentHitPoints: 999999,
          actions: [],
        });
        return runEncounter(
          { combatants: [monster, target], maxRounds: 1 },
          baseSeed + index,
        );
      });
      return aggregateBatchResults(baseSeed, results);
    };

    const claw: EngineAction = {
      id: 'claw',
      name: 'Claw',
      actionType: 'ACTION',
      legendaryActionCost: null,
      attack: {
        toHitMod: 6,
        reach: 5,
        range: null,
        damageDieCount: 1,
        damageDieType: 6,
        damageBonus: 3,
        damageType: 'slashing',
        extraDamageDieCount: 0,
        extraDamageDieType: 0,
        extraDamageBonus: 0,
        extraDamageType: null,
      },
      save: null,
      maxUsesPerEncounter: null,
    };

    const flatSummary = runBatch([claw], null, 5000);
    const multiattackSummary = runBatch(
      [claw],
      [{ actionId: 'claw', count: 2 }],
      5000,
    );

    const flat = flatSummary.combatants.find(c => c.templateKey === 'monster');
    const multi = multiattackSummary.combatants.find(
      c => c.templateKey === 'monster',
    );

    expect(multi?.averageDamageDealt ?? 0).toBeGreaterThan(
      flat?.averageDamageDealt ?? Infinity,
    );
  });
});
