import { describe, expect, it } from 'vitest';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type { EngineAction } from '~/server/simulator/engine/types';

/**
 * Death saving throws (issue #5, milestone 12) — proves the full
 * `runEncounter` wiring, not just the pure `deathSaves.ts` functions
 * already unit-tested directly: a death-save-eligible PC dropping to 0 HP
 * now enters a real dying/rolling process instead of an unconditional
 * instant defeat, resolving one way or the other across many seeded
 * trials, the same "prove it over many trials" style `parityCheck.test.ts`
 * and milestones 10/11's own statistical tests already established.
 */

const pcDagger: EngineAction = {
  id: 'pc-dagger',
  name: 'Dagger',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 3,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 4,
    damageBonus: 1,
    damageType: 'piercing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const fighterLongsword: EngineAction = {
  id: 'fighter-longsword',
  name: 'Longsword',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 7,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 8,
    damageBonus: 6,
    damageType: 'slashing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

/** Tuned so the max possible hit (14) never reaches the massive-damage
 * threshold against the downed PC's 10 max HP (would need >= 20 damage in
 * one hit) — isolating the roll-based dying process from the separate
 * instant-death path, which has its own dedicated test below. */
const monsterClaw: EngineAction = {
  id: 'monster-claw',
  name: 'Claw',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 5,
    reach: 5,
    range: null,
    damageDieCount: 2,
    damageDieType: 6,
    damageBonus: 2,
    damageType: 'slashing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const buildScenario = () => ({
  combatants: [
    buildCombatant({
      id: 'downed-pc',
      templateKey: 'downed-pc',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 12,
      maxHitPoints: 10,
      currentHitPoints: 10,
      initiativeBonus: 3,
      actions: [pcDagger],
      tracksDeathSaves: true,
    }),
    buildCombatant({
      id: 'fighter',
      templateKey: 'fighter',
      side: 'party',
      position: { x: 1, y: 0 },
      armorClass: 18,
      maxHitPoints: 60,
      currentHitPoints: 60,
      initiativeBonus: 1,
      actions: [fighterLongsword],
      tracksDeathSaves: true,
    }),
    buildCombatant({
      id: 'monster',
      templateKey: 'monster',
      side: 'monsters',
      position: { x: 0, y: 1 },
      armorClass: 13,
      maxHitPoints: 50,
      currentHitPoints: 50,
      initiativeBonus: 0,
      actions: [monsterClaw],
    }),
  ],
});

describe('runEncounter death saves', () => {
  it('a downed PC ends some trials dead and other trials alive at 0 HP, having actually rolled', () => {
    const outcomes = { dead: 0, aliveAtZero: 0, neverWentDown: 0 };
    let sawDeathSaveRoll = false;
    let sawStabilized = false;
    let sawRevived = false;

    for (let seed = 1; seed <= 400; seed += 1) {
      const result = runEncounter(buildScenario(), seed);
      const pcFinal = result.combatants.find(c => c.id === 'downed-pc')!;

      if (
        result.log.some(
          entry =>
            entry.kind === 'death-save' && entry.combatantId === 'downed-pc',
        )
      ) {
        sawDeathSaveRoll = true;
      }
      if (
        result.log.some(
          entry =>
            entry.kind === 'stabilized' && entry.combatantId === 'downed-pc',
        )
      ) {
        sawStabilized = true;
      }
      if (
        result.log.some(
          entry =>
            entry.kind === 'revived' && entry.combatantId === 'downed-pc',
        )
      ) {
        sawRevived = true;
      }

      if (pcFinal.finalHitPoints > 0) outcomes.neverWentDown += 1;
      else if (pcFinal.survived) outcomes.aliveAtZero += 1;
      else outcomes.dead += 1;
    }

    expect(sawDeathSaveRoll).toBe(true);
    expect(sawStabilized).toBe(true);
    expect(sawRevived).toBe(true);
    // The whole point of this milestone: dropping to 0 HP is no longer an
    // unconditional, automatic defeat for a death-save-eligible PC.
    expect(outcomes.dead).toBeGreaterThan(0);
    expect(outcomes.aliveAtZero).toBeGreaterThan(0);
  });

  it('massive damage kills a PC instantly, with no death-save rolls at all', () => {
    const devastatingBlow: EngineAction = {
      id: 'devastating-blow',
      name: 'Devastating Blow',
      actionType: 'ACTION',
      legendaryActionCost: null,
      attack: {
        toHitMod: 20,
        reach: 5,
        range: null,
        damageDieCount: 10,
        damageDieType: 10,
        damageBonus: 50,
        damageType: 'bludgeoning',
        extraDamageDieCount: 0,
        extraDamageDieType: 0,
        extraDamageBonus: 0,
        extraDamageType: null,
      },
      save: null,
      maxUsesPerEncounter: null,
    };

    const pc = buildCombatant({
      id: 'pc',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 5,
      maxHitPoints: 10,
      currentHitPoints: 10,
      actions: [],
      tracksDeathSaves: true,
    });
    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 5,
      maxHitPoints: 20,
      currentHitPoints: 20,
      actions: [devastatingBlow],
    });

    const result = runEncounter({ combatants: [pc, monster] }, 1);
    const pcFinal = result.combatants.find(c => c.id === 'pc')!;

    expect(pcFinal.survived).toBe(false);
    expect(pcFinal.finalHitPoints).toBe(0);
    expect(result.log.some(entry => entry.kind === 'death-save')).toBe(false);
    expect(result.log.some(entry => entry.kind === 'down')).toBe(false);
    expect(
      result.log.some(
        entry => entry.kind === 'defeated' && entry.combatantId === 'pc',
      ),
    ).toBe(true);
  });

  it('a monster still dies outright at 0 HP, unchanged from before this milestone', () => {
    const pc = buildCombatant({
      id: 'pc',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 10,
      maxHitPoints: 40,
      currentHitPoints: 40,
      actions: [fighterLongsword],
      tracksDeathSaves: true,
    });
    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 8,
      maxHitPoints: 6,
      currentHitPoints: 6,
      actions: [monsterClaw],
      tracksDeathSaves: false,
    });

    const result = runEncounter({ combatants: [pc, monster] }, 2);
    const monsterFinal = result.combatants.find(c => c.id === 'monster')!;

    expect(monsterFinal.survived).toBe(false);
    expect(result.log.some(entry => entry.kind === 'death-save')).toBe(false);
    expect(
      result.log.some(
        entry => entry.kind === 'defeated' && entry.combatantId === 'monster',
      ),
    ).toBe(true);
  });
});
