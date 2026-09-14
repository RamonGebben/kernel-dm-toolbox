import { describe, expect, it } from 'vitest';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { aggregateBatchResults } from '~/server/simulator/engine/aggregateBatchResults';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type {
  EngineAction,
  EngineCombatant,
} from '~/server/simulator/engine/types';

/**
 * Balance sanity checks (issue #5, milestone 8's tuning pass): a few small,
 * well-understood 5e fights run through the real engine hundreds of times,
 * asserting the aggregate win rate lands in the directionally-correct band —
 * not an exact number (the engine's own targeting/positioning AI adds
 * variance no closed-form DPR calculation captures), just "is this obviously
 * broken." Written after milestone 8 discovered and fixed a real gap:
 * `attacksPerTurn`/Extra Attack existed as hand-authored content
 * (`classProgression`) since milestone 1 but nothing consumed it until now —
 * these fixtures are deliberately built with `attacksPerTurn` set so the
 * checks exercise the corrected engine, not the pre-fix one-attack-per-turn
 * behavior every combatant had before.
 */

const TRIAL_COUNT = 300;

const runBatch = (combatants: EngineCombatant[], baseSeed: number) => {
  const results = Array.from({ length: TRIAL_COUNT }, (_, index) =>
    runEncounter({ combatants }, baseSeed + index),
  );
  return aggregateBatchResults(baseSeed, results);
};

const longsword: EngineAction = {
  id: 'longsword',
  name: 'Longsword',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 7,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 8,
    damageBonus: 4,
    damageType: 'slashing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const scimitar: EngineAction = {
  id: 'scimitar',
  name: 'Scimitar',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 4,
    reach: 5,
    range: null,
    damageDieCount: 1,
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

/** SRD-2024 5th-level Fighter, roughly: AC 18 (chain mail + shield), 44 HP,
 * a +7/1d8+4 longsword, Extra Attack (2 attacks/turn from level 5). */
const buildFighter = (id: string, position: { x: number; y: number }) =>
  buildCombatant({
    id,
    templateKey: 'fighter',
    name: 'Fighter',
    side: 'party',
    position,
    armorClass: 18,
    maxHitPoints: 44,
    currentHitPoints: 44,
    initiativeBonus: 1,
    attacksPerTurn: 2,
    actions: [longsword],
  });

/** SRD-2024 Goblin, roughly: AC 15, 7 HP, a +4/1d6+2 scimitar. */
const buildGoblin = (id: string, position: { x: number; y: number }) =>
  buildCombatant({
    id,
    templateKey: 'goblin',
    name: 'Goblin',
    side: 'monsters',
    position,
    armorClass: 15,
    maxHitPoints: 7,
    currentHitPoints: 7,
    initiativeBonus: 2,
    attacksPerTurn: 1,
    actions: [scimitar],
  });

describe('parity spot-checks against known encounters', () => {
  it('4 goblins vs a single 5th-level fighter is roughly winnable, not a lost cause', () => {
    const fighter = buildFighter('fighter', { x: 0, y: 0 });
    const goblins = [
      buildGoblin('goblin-1', { x: 2, y: 0 }),
      buildGoblin('goblin-2', { x: -2, y: 0 }),
      buildGoblin('goblin-3', { x: 0, y: 2 }),
      buildGoblin('goblin-4', { x: 0, y: -2 }),
    ];

    const summary = runBatch([fighter, ...goblins], 1000);

    // A real "roughly winnable" fight: contested, not a coin flip either
    // way. Wide bounds on purpose — this is a sanity check that the engine's
    // dice/to-hit/targeting math isn't obviously broken, not a calibration
    // of exact 5e encounter-difficulty numbers.
    expect(summary.partyWinRate).toBeGreaterThan(0.15);
    expect(summary.partyWinRate).toBeLessThan(0.95);
    expect(
      summary.combatants.find(c => c.name === 'Fighter')?.killRate,
    ).toBeGreaterThan(1);
  });

  it('a single goblin vs a full 4-person party almost always loses', () => {
    const party = [
      buildFighter('fighter-1', { x: 0, y: 0 }),
      buildFighter('fighter-2', { x: 1, y: 0 }),
      buildFighter('fighter-3', { x: 0, y: 1 }),
      buildFighter('fighter-4', { x: 1, y: 1 }),
    ];
    const goblin = buildGoblin('goblin', { x: 8, y: 8 });

    const summary = runBatch([...party, goblin], 2000);

    expect(summary.partyWinRate).toBeGreaterThan(0.95);
    expect(summary.monsterWinRate).toBeLessThan(0.05);
  });

  it('a weaker attacker deals less average damage per trial than a stronger one', () => {
    // An unkillable, harmless dummy (no actions of its own, so it never
    // retaliates and both attackers survive and swing every round for the
    // full `maxRounds`) — isolates the comparison to pure to-hit/damage
    // math, run as two fully separate fights rather than sharing one board
    // (which would confound "who deals more damage" with "who happened to
    // reach melee range first" / "who died first to a shared target").
    const buildDummy = () =>
      buildCombatant({
        id: 'dummy',
        templateKey: 'dummy',
        side: 'monsters',
        position: { x: 1, y: 0 },
        maxHitPoints: 999999,
        currentHitPoints: 999999,
        armorClass: 1,
        actions: [],
      });

    const strongAttacker = buildCombatant({
      id: 'strong',
      templateKey: 'strong',
      side: 'party',
      position: { x: 0, y: 0 },
      actions: [longsword],
    });
    const weakAttacker = buildCombatant({
      id: 'weak',
      templateKey: 'weak',
      side: 'party',
      position: { x: 0, y: 0 },
      actions: [scimitar],
    });

    const strongSummary = runBatch([strongAttacker, buildDummy()], 3000);
    const weakSummary = runBatch([weakAttacker, buildDummy()], 3000);

    const strong = strongSummary.combatants.find(
      c => c.templateKey === 'strong',
    );
    const weak = weakSummary.combatants.find(c => c.templateKey === 'weak');

    // Both fights run the full 50 rounds (the dummy never dies or fights
    // back), so this is a stable, direct dice-math comparison: +7/1d8+4
    // should clearly outdamage +4/1d6+2 over that many swings.
    expect(strong?.averageDamageDealt ?? 0).toBeGreaterThan(
      weak?.averageDamageDealt ?? Infinity,
    );
  });
});
