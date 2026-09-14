import { describe, expect, it } from 'vitest';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type { EngineAction } from '~/server/simulator/engine/types';

const strongAttack: EngineAction = {
  id: 'strong-attack',
  name: 'Greatsword',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 20,
    reach: 5,
    range: null,
    damageDieCount: 4,
    damageDieType: 6,
    damageBonus: 10,
    damageType: 'slashing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const weakAttack: EngineAction = {
  id: 'weak-attack',
  name: 'Dagger',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: -10,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 4,
    damageBonus: 0,
    damageType: 'piercing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

describe('runEncounter', () => {
  it('has the overwhelmingly stronger side win', () => {
    const hero = buildCombatant({
      id: 'hero',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 25,
      actions: [strongAttack],
    });
    const goblin = buildCombatant({
      id: 'goblin',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 5,
      maxHitPoints: 7,
      currentHitPoints: 7,
      actions: [weakAttack],
    });

    const result = runEncounter({ combatants: [hero, goblin] }, 1);

    expect(result.winner).toBe('party');
    expect(result.combatants.find(c => c.id === 'goblin')?.survived).toBe(
      false,
    );
    expect(result.combatants.find(c => c.id === 'hero')?.survived).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    const buildScenario = () => ({
      combatants: [
        buildCombatant({
          id: 'hero',
          side: 'party',
          position: { x: 0, y: 0 },
          actions: [weakAttack],
        }),
        buildCombatant({
          id: 'goblin',
          side: 'monsters',
          position: { x: 1, y: 0 },
          actions: [weakAttack],
        }),
      ],
    });

    const first = runEncounter(buildScenario(), 12345);
    const second = runEncounter(buildScenario(), 12345);

    expect(first).toEqual(second);
  });

  it('produces different outcomes for different seeds often enough to matter', () => {
    const buildScenario = () => ({
      combatants: [
        buildCombatant({
          id: 'hero',
          side: 'party',
          position: { x: 0, y: 0 },
          armorClass: 12,
          actions: [weakAttack],
        }),
        buildCombatant({
          id: 'goblin',
          side: 'monsters',
          position: { x: 1, y: 0 },
          armorClass: 12,
          actions: [weakAttack],
        }),
      ],
    });

    const outcomes = new Set(
      Array.from(
        { length: 20 },
        (_, seed) => runEncounter(buildScenario(), seed).winner,
      ),
    );

    expect(outcomes.size).toBeGreaterThan(1);
  });

  it('calls it a draw when neither side can land a hit before maxRounds', () => {
    const unhittable = buildCombatant({
      id: 'hero',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 999,
      actions: [weakAttack],
    });
    const alsoUnhittable = buildCombatant({
      id: 'goblin',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 999,
      actions: [weakAttack],
    });

    const result = runEncounter(
      { combatants: [unhittable, alsoUnhittable], maxRounds: 5 },
      1,
    );

    expect(result.winner).toBe('draw');
    expect(result.rounds).toBe(5);
  });

  it('lets a combatant with legendary actions act between other turns', () => {
    const legendaryAttack: EngineAction = {
      id: 'legendary-bite',
      name: 'Bite',
      actionType: 'LEGENDARY_ACTION',
      legendaryActionCost: 1,
      attack: strongAttack.attack,
      save: null,
      maxUsesPerEncounter: null,
    };

    const dragon = buildCombatant({
      id: 'dragon',
      side: 'monsters',
      position: { x: 0, y: 0 },
      maxHitPoints: 200,
      currentHitPoints: 200,
      initiativeBonus: 10,
      actions: [weakAttack, legendaryAttack],
    });
    const heroA = buildCombatant({
      id: 'hero-a',
      side: 'party',
      position: { x: 1, y: 0 },
      armorClass: 5,
      initiativeBonus: -10,
      actions: [weakAttack],
    });
    const heroB = buildCombatant({
      id: 'hero-b',
      side: 'party',
      position: { x: 2, y: 0 },
      armorClass: 5,
      initiativeBonus: -9,
      actions: [weakAttack],
    });

    const result = runEncounter(
      { combatants: [dragon, heroA, heroB], maxRounds: 3 },
      1,
    );

    const legendaryLogEntries = result.log.filter(
      entry => entry.kind === 'attack' && entry.actionName === 'Bite',
    );

    expect(legendaryLogEntries.length).toBeGreaterThan(0);
  });

  it('lets a combatant with attacksPerTurn > 1 attack more than once in a turn', () => {
    const attacker = buildCombatant({
      id: 'attacker',
      side: 'party',
      position: { x: 0, y: 0 },
      attacksPerTurn: 2,
      actions: [strongAttack],
    });
    const punchingBag = buildCombatant({
      id: 'punching-bag',
      side: 'monsters',
      position: { x: 1, y: 0 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      armorClass: 5,
      actions: [weakAttack],
    });

    const result = runEncounter(
      { combatants: [attacker, punchingBag], maxRounds: 1 },
      1,
    );

    const attackerHits = result.log.filter(
      entry => entry.kind === 'attack' && entry.combatantId === 'attacker',
    );

    expect(attackerHits.length).toBe(2);
  });

  it('never repeats a save/spell action even with attacksPerTurn > 1', () => {
    const caster: EngineAction = {
      id: 'fire-bolt',
      name: 'Fire Bolt',
      actionType: 'ACTION',
      legendaryActionCost: null,
      attack: null,
      save: {
        saveAbility: 'dexterity',
        saveDc: 1,
        areaType: null,
        areaSize: null,
        damageOnFailRoll: '1d4',
        damageOnFailType: 'fire',
        halfDamageOnSave: true,
      },
      maxUsesPerEncounter: null,
    };

    const attacker = buildCombatant({
      id: 'attacker',
      side: 'party',
      position: { x: 0, y: 0 },
      attacksPerTurn: 2,
      actions: [caster],
    });
    const target = buildCombatant({
      id: 'target',
      side: 'monsters',
      position: { x: 1, y: 0 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      actions: [weakAttack],
    });

    const result = runEncounter(
      { combatants: [attacker, target], maxRounds: 1 },
      1,
    );

    const casts = result.log.filter(
      entry => entry.kind === 'save-effect' && entry.combatantId === 'attacker',
    );

    expect(casts.length).toBe(1);
  });

  it('respects an action with a maxUsesPerEncounter cap', () => {
    const oneShot: EngineAction = {
      id: 'one-shot',
      name: 'Fire Breath',
      actionType: 'ACTION',
      legendaryActionCost: null,
      attack: null,
      save: {
        saveAbility: 'dexterity',
        saveDc: 1,
        areaType: null,
        areaSize: null,
        damageOnFailRoll: '1d4',
        damageOnFailType: 'fire',
        halfDamageOnSave: true,
      },
      maxUsesPerEncounter: 1,
    };

    const hero = buildCombatant({
      id: 'hero',
      side: 'party',
      position: { x: 0, y: 0 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      armorClass: 999,
      actions: [weakAttack],
    });
    const dragon = buildCombatant({
      id: 'dragon',
      side: 'monsters',
      position: { x: 1, y: 0 },
      actions: [oneShot],
    });

    const result = runEncounter(
      { combatants: [hero, dragon], maxRounds: 10 },
      1,
    );

    const uses = result.log.filter(
      entry =>
        entry.kind === 'save-effect' && entry.actionName === 'Fire Breath',
    );

    expect(uses.length).toBe(1);
  });
});
