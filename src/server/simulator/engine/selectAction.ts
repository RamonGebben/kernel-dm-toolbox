import { chebyshevDistanceFeet } from '~/server/simulator/engine/grid';
import type {
  EngineAction,
  EngineCombatant,
} from '~/server/simulator/engine/types';

export type ActionChoice = {
  action: EngineAction;
  /** The primary target — where an attack lands, or the point an AoE save
   * effect is aimed at. */
  target: EngineCombatant;
  /** Every living enemy actually caught by the effect: just `[target]` for
   * a single-target attack/save, every enemy within `areaSize` feet of
   * `target` for an AoE save. */
  affected: EngineCombatant[];
};

/** How far an attack reaches — melee `reach` or ranged `range`, whichever
 * is set; an attack with neither defaults to a plain 5-foot melee reach. */
const attackRangeFeet = (action: EngineAction): number =>
  action.attack?.reach ?? action.attack?.range ?? 5;

const isInRange = (
  self: EngineCombatant,
  target: EngineCombatant,
  action: EngineAction,
): boolean =>
  chebyshevDistanceFeet(self.position, target.position) <=
  attackRangeFeet(action);

/** Every living enemy within an AoE save action's `areaSize` feet of
 * `origin` — every 5e area shape (cone/line/sphere/cube) collapses to this
 * single "within N feet" test. Exact cone/line/cube footprint geometry is a
 * real simplification (the issue itself flags precise AoE geometry as
 * substantial follow-up work); a circle is the roughest approximation of
 * all four shapes, chosen because it is the one that can never miss an
 * enemy the real shape would have caught — this engine would rather
 * overcount a fringe target than let an AI skip an AoE that should have
 * been worth using. */
const affectedByArea = (
  origin: EngineCombatant,
  areaSizeFeet: number,
  enemies: readonly EngineCombatant[],
): EngineCombatant[] =>
  enemies.filter(
    enemy =>
      chebyshevDistanceFeet(origin.position, enemy.position) <= areaSizeFeet,
  );

/** An Intelligence save modifier at or above this counts as "smart" for
 * targeting purposes — `EngineCombatant` carries no raw ability scores (see
 * its own doc comment on `saveModifiers`), so this reuses the save modifier
 * as the closest available proxy rather than adding a field nothing else
 * needs yet. */
const SMART_INTELLIGENCE_THRESHOLD = 2;

/** Below this fraction of max HP, a nearly-dead enemy doesn't need a limited
 * resource spent to finish it off — see the `nearlyDead` branch below. */
const NEARLY_DEAD_HP_FRACTION = 0.25;

const hpFraction = (combatant: EngineCombatant): number =>
  combatant.currentHitPoints / combatant.maxHitPoints;

const nearestEnemy = (
  self: EngineCombatant,
  livingEnemies: readonly EngineCombatant[],
): EngineCombatant =>
  livingEnemies.reduce((closest, enemy) =>
    chebyshevDistanceFeet(self.position, enemy.position) <
    chebyshevDistanceFeet(self.position, closest.position)
      ? enemy
      : closest,
  );

const mostWoundedEnemy = (
  livingEnemies: readonly EngineCombatant[],
): EngineCombatant =>
  livingEnemies.reduce((weakest, enemy) =>
    hpFraction(enemy) < hpFraction(weakest) ? enemy : weakest,
  );

/**
 * Int-modifier-driven targeting, per the issue's own reference behaviour:
 * a "smart" combatant goes for the most wounded living enemy (finishing off
 * a target rather than spreading damage), a "dumb" one just charges
 * whoever's closest. `nearestEnemy` also serves as the AI's own melee/
 * retreat movement target regardless of this choice — see `runEncounter.ts`.
 */
export const chooseTarget = (
  self: EngineCombatant,
  livingEnemies: readonly EngineCombatant[],
): EngineCombatant =>
  self.saveModifiers.intelligence >= SMART_INTELLIGENCE_THRESHOLD
    ? mostWoundedEnemy(livingEnemies)
    : nearestEnemy(self, livingEnemies);

/**
 * The targeting AI: Int-driven target choice (see `chooseTarget`), an AoE
 * save action preferred over a single-target one when it would actually
 * catch two or more enemies (the issue's own "a dragon only breathes if it
 * hits 2+ enemies" reference behaviour), and a simple wasted-resource guard
 * — a nearly-dead target gets finished off with an unlimited-use attack
 * before a limited one, so a one-per-encounter ability isn't burned closing
 * out a fight that's already won. `availableActionIds` is how a caller gates
 * recharge/legendary/per-encounter use limits without this function needing
 * to be stateful. HP-threshold retreat is a separate, movement-level
 * decision — see `retreat.ts` and `runEncounter.ts`'s `takeTurn`, which
 * calls this only after deciding whether/where to move.
 */
export const selectAction = (
  self: EngineCombatant,
  enemies: readonly EngineCombatant[],
  availableActionIds: ReadonlySet<string>,
): ActionChoice | null => {
  const livingEnemies = enemies.filter(enemy => enemy.currentHitPoints > 0);
  if (!livingEnemies.length) return null;

  const target = chooseTarget(self, livingEnemies);

  const usable = self.actions.filter(
    action =>
      availableActionIds.has(action.id) && (action.attack || action.save),
  );

  const aoeChoice = usable
    .filter(action => action.save?.areaType && action.save.areaSize)
    .map(action => ({
      action,
      affected: affectedByArea(target, action.save!.areaSize!, livingEnemies),
    }))
    .filter(candidate => candidate.affected.length >= 2)
    .sort((a, b) => b.affected.length - a.affected.length)[0];

  if (aoeChoice) {
    return { action: aoeChoice.action, target, affected: aoeChoice.affected };
  }

  const attackCandidates = usable.filter(
    action => action.attack && isInRange(self, target, action),
  );
  const attackInRange =
    hpFraction(target) <= NEARLY_DEAD_HP_FRACTION
      ? (attackCandidates.find(action => action.maxUsesPerEncounter === null) ??
        attackCandidates[0])
      : attackCandidates[0];
  if (attackInRange) {
    return { action: attackInRange, target, affected: [target] };
  }

  const anySaveAction = usable.find(action => action.save);
  if (anySaveAction) {
    return {
      action: anySaveAction,
      target,
      affected:
        anySaveAction.save?.areaType && anySaveAction.save.areaSize
          ? affectedByArea(target, anySaveAction.save.areaSize, livingEnemies)
          : [target],
    };
  }

  return null;
};

export { attackRangeFeet, isInRange, nearestEnemy };
