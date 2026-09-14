import { describe, expect, it } from 'vitest';
import { aggregateBatchResults } from '~/server/simulator/engine/aggregateBatchResults';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type {
  EngineAction,
  EngineResult,
} from '~/server/simulator/engine/types';

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

/** A single-target-only fixture: one party member, one monster instance —
 * every `templateKey` group in these tests has exactly one instance per
 * trial, so per-instance and per-trial stats coincide and assertions stay
 * simple. The multi-instance case (a stacked monster entry) is covered
 * separately below with hand-built `EngineResult`s. */
const buildLopsidedScenario = () => ({
  combatants: [
    buildCombatant({
      id: 'hero',
      templateKey: 'hero',
      name: 'Hero',
      side: 'party' as const,
      position: { x: 0, y: 0 },
      armorClass: 25,
      actions: [strongAttack],
    }),
    buildCombatant({
      id: 'goblin',
      templateKey: 'goblin-entry',
      name: 'Goblin',
      side: 'monsters' as const,
      position: { x: 1, y: 0 },
      armorClass: 5,
      maxHitPoints: 7,
      currentHitPoints: 7,
      actions: [weakAttack],
    }),
  ],
});

describe('aggregateBatchResults', () => {
  it('summarizes win rate, round stats and per-combatant stats over real runs', () => {
    const results: EngineResult[] = Array.from({ length: 20 }, (_, index) =>
      runEncounter(buildLopsidedScenario(), 1000 + index),
    );

    const summary = aggregateBatchResults(1000, results);

    expect(summary.trialCount).toBe(20);
    expect(summary.baseSeed).toBe(1000);
    // The hero is overwhelmingly stronger — matches `runEncounter`'s own
    // "overwhelmingly stronger side wins" sanity check, just repeated.
    expect(summary.partyWinRate).toBeGreaterThan(0.9);
    expect(
      summary.partyWinRate + summary.monsterWinRate + summary.drawRate,
    ).toBeCloseTo(1);
    expect(summary.roundsMin).toBeGreaterThanOrEqual(1);
    expect(summary.roundsMax).toBeGreaterThanOrEqual(summary.roundsMin);
    expect(summary.roundsMean).toBeGreaterThanOrEqual(summary.roundsMin);
    expect(
      summary.roundDistribution.reduce((sum, bucket) => sum + bucket.trials, 0),
    ).toBe(20);

    const hero = summary.combatants.find(c => c.templateKey === 'hero');
    const goblin = summary.combatants.find(
      c => c.templateKey === 'goblin-entry',
    );
    expect(hero?.survivalRate).toBeGreaterThan(0.9);
    expect(hero?.averageDamageDealt).toBeGreaterThan(0);
    expect(goblin?.survivalRate).toBeLessThan(0.1);
    expect(goblin?.killRate).toBeCloseTo(0, 1);
  });

  it('returns an all-zero summary for zero trials', () => {
    const summary = aggregateBatchResults(42, []);

    expect(summary).toMatchObject({
      trialCount: 0,
      baseSeed: 42,
      partyWinRate: 0,
      monsterWinRate: 0,
      drawRate: 0,
      roundsMin: 0,
      roundsMax: 0,
      roundsMean: 0,
      roundsMedian: 0,
      roundDistribution: [],
      combatants: [],
    });
  });

  it('reports a 100% win rate and a single round bucket for one trial', () => {
    const result = runEncounter(buildLopsidedScenario(), 5);
    const summary = aggregateBatchResults(5, [result]);

    expect(summary.trialCount).toBe(1);
    expect(summary.partyWinRate).toBe(1);
    expect(summary.monsterWinRate).toBe(0);
    expect(summary.drawRate).toBe(0);
    expect(summary.roundDistribution).toEqual([
      { rounds: result.rounds, trials: 1 },
    ]);
  });

  it('groups multiple instances of one monster entry under one templateKey and strips instance numbering', () => {
    const buildFinal = (id: string, name: string, survived: boolean) => ({
      id,
      templateKey: 'goblin-entry',
      name,
      side: 'monsters' as const,
      maxHitPoints: 7,
      finalHitPoints: survived ? 3 : 0,
      survived,
    });

    const heroFinal = {
      id: 'hero-1',
      templateKey: 'hero',
      name: 'Hero',
      side: 'party' as const,
      maxHitPoints: 30,
      finalHitPoints: 30,
      survived: true,
    };

    const trial: EngineResult = {
      seed: 1,
      winner: 'party',
      rounds: 3,
      log: [
        {
          kind: 'attack',
          combatantId: 'hero-1',
          targetId: 'goblin-1',
          actionName: 'Greatsword',
          attackRoll: 25,
          targetArmorClass: 12,
          hit: true,
          critical: false,
          damage: 7,
        },
        { kind: 'defeated', combatantId: 'goblin-1', name: 'Goblin 1' },
        {
          kind: 'attack',
          combatantId: 'hero-1',
          targetId: 'goblin-2',
          actionName: 'Greatsword',
          attackRoll: 25,
          targetArmorClass: 12,
          hit: true,
          critical: false,
          damage: 4,
        },
      ],
      combatants: [
        heroFinal,
        buildFinal('goblin-1', 'Goblin 1', false),
        buildFinal('goblin-2', 'Goblin 2', true),
      ],
    };

    const summary = aggregateBatchResults(1, [trial]);
    const goblins = summary.combatants.find(
      c => c.templateKey === 'goblin-entry',
    );

    expect(summary.combatants).toHaveLength(2);
    expect(goblins).toMatchObject({
      name: 'Goblin',
      survivalRate: 0.5,
      // Monsters never carry a `down` entry — they're removed outright at
      // 0 HP (`tracksDeathSaves` false) — so this always reads 0 for them.
      wentDownRate: 0,
      averageDamageTaken: (7 + 4) / 2,
      killRate: 0,
    });

    const hero = summary.combatants.find(c => c.templateKey === 'hero');
    expect(hero).toMatchObject({
      name: 'Hero',
      survivalRate: 1,
      wentDownRate: 0,
      averageDamageDealt: 7 + 4,
      // One kill (Goblin 1), one instance -> killRate 1.
      killRate: 1,
    });
  });

  it('reports wentDownRate from `down` entries, independent of survivalRate', () => {
    // One PC across two trials: goes down and stabilizes in trial 1
    // (survives, but did go down), stays healthy in trial 2 (survives,
    // never went down) — proving the two rates track different things.
    const buildTrial = (wentDown: boolean): EngineResult => ({
      seed: 1,
      winner: 'party',
      rounds: 3,
      log: wentDown
        ? [{ kind: 'down', combatantId: 'hero-1', name: 'Hero' }]
        : [],
      combatants: [
        {
          id: 'hero-1',
          templateKey: 'hero',
          name: 'Hero',
          side: 'party' as const,
          maxHitPoints: 30,
          finalHitPoints: wentDown ? 0 : 20,
          survived: true,
        },
      ],
    });

    const summary = aggregateBatchResults(1, [
      buildTrial(true),
      buildTrial(false),
    ]);

    const hero = summary.combatants.find(c => c.templateKey === 'hero');
    expect(hero).toMatchObject({ survivalRate: 1, wentDownRate: 0.5 });
  });
});
