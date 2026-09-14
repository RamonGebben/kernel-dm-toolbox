import { describe, expect, it } from 'vitest';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type {
  EngineAction,
  EngineActiveCondition,
} from '~/server/simulator/engine/types';

const activeCondition = (
  conditionKey: string,
  overrides: Partial<EngineActiveCondition> = {},
): EngineActiveCondition => ({
  conditionKey,
  roundsRemaining: null,
  saveEndsEachTurn: false,
  saveAbility: null,
  saveDc: null,
  concentrationSourceId: null,
  ...overrides,
});

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

describe('runEncounter — conditions', () => {
  it('skips an incapacitated combatant\'s entire turn', () => {
    const paralyzedHero = buildCombatant({
      id: 'hero',
      side: 'party',
      position: { x: 0, y: 0 },
      actions: [weakAttack],
      activeConditions: [activeCondition('paralyzed')],
    });
    const goblin = buildCombatant({
      id: 'goblin',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 999,
      actions: [weakAttack],
    });

    const result = runEncounter(
      { combatants: [paralyzedHero, goblin], maxRounds: 2 },
      1,
    );

    const heroActed = result.log.some(
      entry =>
        (entry.kind === 'attack' || entry.kind === 'save-effect' || entry.kind === 'move') &&
        entry.combatantId === 'hero',
    );
    const heroSkipped = result.log.some(
      entry => entry.kind === 'no-action' && entry.combatantId === 'hero' && entry.reason === 'incapacitated',
    );

    expect(heroActed).toBe(false);
    expect(heroSkipped).toBe(true);
  });

  it('expires a fixed-duration condition after its rounds run out', () => {
    const hero = buildCombatant({
      id: 'hero',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 999,
      actions: [weakAttack],
      activeConditions: [activeCondition('poisoned', { roundsRemaining: 2 })],
    });
    const goblin = buildCombatant({
      id: 'goblin',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 999,
      actions: [weakAttack],
    });

    const result = runEncounter(
      { combatants: [hero, goblin], maxRounds: 5 },
      1,
    );

    const expiry = result.log.find(
      entry =>
        entry.kind === 'condition-removed' &&
        entry.combatantId === 'hero' &&
        entry.reason === 'expired',
    );
    expect(expiry).toMatchObject({ conditionKey: 'poisoned' });
  });

  it('removes a saveEndsEachTurn condition once the affected creature succeeds its repeated save', () => {
    // A DC of 1 always succeeds against a 0-modifier d20 roll, so this
    // should be removed the very first time the hero's own turn ends.
    const hero = buildCombatant({
      id: 'hero',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 999,
      actions: [weakAttack],
      activeConditions: [
        activeCondition('restrained', {
          saveEndsEachTurn: true,
          saveAbility: 'strength',
          saveDc: 1,
        }),
      ],
    });
    const goblin = buildCombatant({
      id: 'goblin',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 999,
      actions: [weakAttack],
    });

    const result = runEncounter(
      { combatants: [hero, goblin], maxRounds: 1 },
      1,
    );

    expect(result.log).toContainEqual(
      expect.objectContaining({
        kind: 'condition-removed',
        combatantId: 'hero',
        conditionKey: 'restrained',
        reason: 'save-succeeded',
      }),
    );
  });

  it('ends concentration and removes its condition when a big hit fails the concentration check', () => {
    const holdMonster: EngineAction = {
      id: 'hold-monster',
      name: 'Hold Monster',
      actionType: 'ACTION',
      legendaryActionCost: null,
      attack: null,
      save: {
        saveAbility: 'wisdom',
        saveDc: 999, // guarantees the target fails and the condition lands
        areaType: null,
        areaSize: null,
        damageOnFailRoll: null,
        damageOnFailType: null,
        halfDamageOnSave: true,
        appliesConditionKey: 'restrained',
        conditionDurationRounds: null,
        conditionSaveEndsEachTurn: false,
      },
      maxUsesPerEncounter: 1,
      requiresConcentration: true,
    };
    const hugeAttack: EngineAction = {
      id: 'huge-attack',
      name: 'Overwhelming Strike',
      actionType: 'ACTION',
      legendaryActionCost: null,
      attack: {
        toHitMod: 20,
        reach: 5,
        range: null,
        damageDieCount: 50,
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
    };

    const caster = buildCombatant({
      id: 'caster',
      side: 'party',
      position: { x: 0, y: 0 },
      maxHitPoints: 500,
      currentHitPoints: 500,
      initiativeBonus: 100, // always acts first
      actions: [holdMonster],
    });
    const brute = buildCombatant({
      id: 'brute',
      side: 'monsters',
      position: { x: 1, y: 0 },
      armorClass: 5,
      initiativeBonus: -100, // always acts second
      actions: [hugeAttack],
    });

    const result = runEncounter(
      { combatants: [caster, brute], maxRounds: 1 },
      1,
    );

    expect(result.log).toContainEqual(
      expect.objectContaining({ kind: 'condition-applied', combatantId: 'brute', conditionKey: 'restrained' }),
    );
    expect(result.log).toContainEqual(
      expect.objectContaining({ kind: 'concentration-check', combatantId: 'caster', succeeded: false }),
    );
    expect(result.log).toContainEqual(
      expect.objectContaining({
        kind: 'condition-removed',
        combatantId: 'brute',
        conditionKey: 'restrained',
        reason: 'concentration-broken',
      }),
    );
  });

  it('a paralyzing action measurably raises its side\'s win rate over many seeded trials', () => {
    const buildBaselineFighter = () =>
      buildCombatant({
        id: 'fighter',
        side: 'party',
        position: { x: 0, y: 0 },
        armorClass: 14,
        maxHitPoints: 20,
        currentHitPoints: 20,
        actions: [
          {
            id: 'net',
            name: 'Net',
            actionType: 'ACTION',
            legendaryActionCost: null,
            attack: null,
            save: {
              saveAbility: 'dexterity',
              saveDc: 13,
              areaType: null,
              areaSize: null,
              damageOnFailRoll: '2d4',
              damageOnFailType: 'bludgeoning',
              halfDamageOnSave: true,
              appliesConditionKey: null,
              conditionDurationRounds: null,
              conditionSaveEndsEachTurn: false,
            },
            maxUsesPerEncounter: null,
          },
        ],
      });

    const buildParalyzingFighter = () =>
      buildCombatant({
        id: 'fighter',
        side: 'party',
        position: { x: 0, y: 0 },
        armorClass: 14,
        maxHitPoints: 20,
        currentHitPoints: 20,
        actions: [
          {
            id: 'net',
            name: 'Net',
            actionType: 'ACTION',
            legendaryActionCost: null,
            attack: null,
            save: {
              saveAbility: 'dexterity',
              saveDc: 13,
              areaType: null,
              areaSize: null,
              damageOnFailRoll: '2d4',
              damageOnFailType: 'bludgeoning',
              halfDamageOnSave: true,
              appliesConditionKey: 'paralyzed',
              conditionDurationRounds: null,
              conditionSaveEndsEachTurn: true,
            },
            maxUsesPerEncounter: null,
          },
        ],
      });

    const buildGoblin = () =>
      buildCombatant({
        id: 'goblin',
        side: 'monsters',
        position: { x: 1, y: 0 },
        armorClass: 13,
        maxHitPoints: 15,
        currentHitPoints: 15,
        actions: [weakAttack.attack ? { ...weakAttack, id: 'goblin-attack', attack: { ...weakAttack.attack, toHitMod: 4, damageDieCount: 1, damageDieType: 6, damageBonus: 2 } } : weakAttack],
      });

    const TRIALS = 300;
    const winRateFor = (buildFighter: () => ReturnType<typeof buildCombatant>) => {
      let wins = 0;
      for (let seed = 0; seed < TRIALS; seed += 1) {
        const result = runEncounter(
          { combatants: [buildFighter(), buildGoblin()], maxRounds: 30 },
          seed,
        );
        if (result.winner === 'party') wins += 1;
      }
      return wins / TRIALS;
    };

    const baselineWinRate = winRateFor(buildBaselineFighter);
    const paralyzingWinRate = winRateFor(buildParalyzingFighter);

    expect(paralyzingWinRate).toBeGreaterThan(baselineWinRate + 0.1);
  });
});
