import { rollInitiative } from '~/utils/rollDice';
import { createRng, rollDie } from '~/server/simulator/engine/rng';
import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
  chebyshevDistanceFeet,
  stepAway,
  stepToward,
  type GridCell,
} from '~/server/simulator/engine/grid';
import {
  nearestEnemy,
  selectAction,
} from '~/server/simulator/engine/selectAction';
import {
  resolveAttack,
  resolveSaveAction,
} from '~/server/simulator/engine/resolveAction';
import { spendLegendaryAction } from '~/server/simulator/engine/legendaryActions';
import { shouldRetreat } from '~/server/simulator/engine/retreat';
import type {
  EngineAction,
  EngineCombatant,
  EngineResult,
  EngineScenarioInput,
  EngineSide,
  TurnLogEntry,
} from '~/server/simulator/engine/types';

const DEFAULT_MAX_ROUNDS = 50;
/** The SRD default for a creature that has any legendary actions at all. */
const LEGENDARY_ACTION_POINTS_PER_ROUND = 3;
/** Every combatant without an explicit reach is treated as a plain 5-foot
 * melee threat for opportunity-attack purposes, matching `selectAction`'s
 * own `attackRangeFeet` default. */
const DEFAULT_MELEE_REACH_FEET = 5;

const opposingSide = (side: EngineSide): EngineSide =>
  side === 'party' ? 'monsters' : 'party';

const isLiving = (combatant: EngineCombatant) => combatant.currentHitPoints > 0;

/** The combatant's best melee-capable action, or null if every action it
 * has is ranged-only (`range` set with no `reach`) — used to decide whether
 * it can threaten an opportunity attack at all. Mirrors `attackRangeFeet`'s
 * own "no reach or range set defaults to a plain 5-foot melee attack"
 * assumption. */
const meleeAttackAction = (combatant: EngineCombatant): EngineAction | null =>
  combatant.actions.find(
    action =>
      action.attack &&
      (action.attack.reach != null || action.attack.range == null),
  ) ?? null;

/** Every action a combatant hasn't exhausted this encounter yet. */
const availableActionIds = (
  combatant: EngineCombatant,
  usesSoFar: ReadonlyMap<string, number>,
): Set<string> =>
  new Set(
    combatant.actions
      .filter(
        action =>
          action.maxUsesPerEncounter === null ||
          (usesSoFar.get(action.id) ?? 0) < action.maxUsesPerEncounter,
      )
      .map(action => action.id),
  );

/**
 * Runs one full encounter to resolution: initiative, then rounds of
 * movement + AI-selected actions until one side is wiped out or
 * `maxRounds` is reached. Deterministic for a given `seed` — the same
 * scenario and seed always produce the same log, which is what lets
 * milestone 5's animated viewer replay a run and milestone 6's Monte Carlo
 * mode re-seed cheaply per trial.
 *
 * Pure: every input arrives in `EngineScenarioInput`, every side effect is
 * either a returned value or a `TurnLogEntry` — no I/O, no clock, no
 * `Math.random`. Loading combatants from the database is a separate,
 * explicitly impure step (`loadScenarioCombatants`) that happens before
 * this function is ever called.
 *
 * Modeled, per issue #5 milestone 4's scope: initiative, movement, Int-
 * driven/HP-threshold-retreat targeting AI (`selectAction`/`retreat.ts`),
 * to-hit attacks and DC saves (`resolveAction.ts`), AoE (collapsed to a
 * "within N feet" circle — see `selectAction`'s own doc comment), damage
 * type resistance/immunity/vulnerability (`damageMitigation.ts`), legendary
 * actions and legendary resistance, a flat per-encounter use cap standing in
 * for recharge dice (see `EngineAction.maxUsesPerEncounter`'s doc comment),
 * and opportunity attacks on any move that leaves a threatening enemy's
 * reach.
 *
 * Explicitly NOT modeled, left for a future milestone rather than half-built
 * here: conditions (no action data anywhere yet declares "this inflicts
 * Frightened for N rounds" — `creature_actions`/`custom_creature_actions`'
 * save/area columns cover damage, not status effects, so there is nothing
 * for a condition-tracking system to attach to; building the tracking
 * machinery with no producer would be dead code, not a feature) and
 * concentration (same gap — a PC's known spells aren't yet resolved into
 * `EngineAction`s a caster can actually cast in this engine). Per the
 * issue's own framing, this milestone is acknowledged as "the bulk of the
 * work" and something that "deserves its own follow-up design pass" — these
 * two are exactly that follow-up's likely first items, once the data model
 * grows a way to express them.
 */
export const runEncounter = (
  input: EngineScenarioInput,
  seed: number,
): EngineResult => {
  const rng = createRng(seed);
  const maxRounds = input.maxRounds ?? DEFAULT_MAX_ROUNDS;
  const gridCols = input.gridCols ?? DEFAULT_GRID_COLS;
  const gridRows = input.gridRows ?? DEFAULT_GRID_ROWS;

  const byId = new Map(input.combatants.map(c => [c.id, c]));
  const usesSoFar = new Map<string, Map<string, number>>();
  const log: TurnLogEntry[] = [];
  /** Reset every round — a reaction (an opportunity attack, here the only
   * reaction this engine models) is spent once per round per combatant. */
  let reactionUsedThisRound = new Set<string>();

  const recordUse = (combatantId: string, actionId: string) => {
    const forCombatant =
      usesSoFar.get(combatantId) ?? new Map<string, number>();
    forCombatant.set(actionId, (forCombatant.get(actionId) ?? 0) + 1);
    usesSoFar.set(combatantId, forCombatant);
  };

  const livingOnSide = (side: EngineSide) =>
    [...byId.values()].filter(c => c.side === side && isLiving(c));

  const applyUpdate = (updated: EngineCombatant) => {
    const wasLiving = isLiving(byId.get(updated.id)!);
    byId.set(updated.id, updated);
    if (wasLiving && !isLiving(updated)) {
      log.push({
        kind: 'defeated',
        combatantId: updated.id,
        name: updated.name,
      });
    }
  };

  const resolveChoice = (
    actorId: string,
    choice: ReturnType<typeof selectAction>,
  ) => {
    if (!choice) return;
    recordUse(actorId, choice.action.id);

    if (choice.action.attack) {
      const { updatedTarget, logEntry } = resolveAttack(
        rng,
        actorId,
        choice.action.name,
        choice.action.attack,
        byId.get(choice.target.id)!,
      );
      log.push(logEntry);
      applyUpdate(updatedTarget);
      return;
    }

    if (choice.action.save) {
      const affected = choice.affected.map(c => byId.get(c.id)!);
      const { updatedTargets, logEntry } = resolveSaveAction(
        rng,
        actorId,
        choice.action.name,
        choice.action.save,
        affected,
      );
      log.push(logEntry);
      updatedTargets.forEach(applyUpdate);
    }
  };

  /**
   * Every living enemy of `moverId` that hasn't already used its reaction
   * this round, has a melee-capable action, and covered `from` but not `to`
   * with that action's reach gets one free attack against the mover — 5e's
   * opportunity-attack rule, minus the "disengage" action this engine has no
   * concept of a combatant choosing to spend a whole turn on.
   */
  const checkOpportunityAttacks = (
    moverId: string,
    from: GridCell,
    to: GridCell,
  ) => {
    const mover = byId.get(moverId)!;
    const threats = livingOnSide(opposingSide(mover.side)).filter(
      enemy => !reactionUsedThisRound.has(enemy.id),
    );

    for (const enemy of threats) {
      const meleeAction = meleeAttackAction(enemy);
      if (!meleeAction?.attack) continue;

      const reach = meleeAction.attack.reach ?? DEFAULT_MELEE_REACH_FEET;
      const wasInReach = chebyshevDistanceFeet(enemy.position, from) <= reach;
      const stillInReach = chebyshevDistanceFeet(enemy.position, to) <= reach;
      if (!wasInReach || stillInReach) continue;

      reactionUsedThisRound.add(enemy.id);
      const target = byId.get(moverId);
      if (!target || !isLiving(target)) continue;

      const { updatedTarget, logEntry } = resolveAttack(
        rng,
        enemy.id,
        `${meleeAction.name} (opportunity attack)`,
        meleeAction.attack,
        target,
      );
      log.push(logEntry);
      applyUpdate(updatedTarget);
    }
  };

  /** Moves `combatantId` to `to` (a no-op if already there), logging the
   * move and resolving any opportunity attacks it provokes along the way. */
  const moveTo = (combatantId: string, to: GridCell) => {
    const actor = byId.get(combatantId)!;
    if (to.x === actor.position.x && to.y === actor.position.y) return;

    const from = actor.position;
    log.push({ kind: 'move', combatantId, from, to });
    byId.set(combatantId, { ...actor, position: to });
    checkOpportunityAttacks(combatantId, from, to);
  };

  const rollInitiativeOrder = () => {
    const rolled = input.combatants.map((combatant, index) => ({
      combatantId: combatant.id,
      name: combatant.name,
      roll: rollInitiative(combatant.initiativeBonus, () => rollDie(rng, 20)),
      initiativeBonus: combatant.initiativeBonus,
      index,
    }));

    rolled.sort(
      (a, b) =>
        b.roll - a.roll ||
        b.initiativeBonus - a.initiativeBonus ||
        a.index - b.index,
    );

    log.push({
      kind: 'initiative',
      order: rolled.map(({ combatantId, name, roll }) => ({
        combatantId,
        name,
        roll,
      })),
    });

    return rolled.map(entry => entry.combatantId);
  };

  const takeTurn = (combatantId: string) => {
    const self = byId.get(combatantId)!;
    if (!isLiving(self)) return;

    if (self.actions.some(action => action.actionType === 'LEGENDARY_ACTION')) {
      byId.set(combatantId, {
        ...self,
        legendaryActionPoints: LEGENDARY_ACTION_POINTS_PER_ROUND,
      });
    }

    let actor = byId.get(combatantId)!;
    const enemies = livingOnSide(opposingSide(actor.side));
    if (!enemies.length) return;

    const available = availableActionIds(
      actor,
      usesSoFar.get(combatantId) ?? new Map(),
    );
    const stepCells = Math.max(0, Math.floor(actor.speed / 5));

    // HP-threshold retreat (see `retreat.ts`) always moves first, away from
    // the nearest threat — a retreating caster can still act afterward if
    // something remains in range post-move (a kited ranged attack/spell); a
    // retreating melee combatant typically won't, which is the point.
    const retreating = shouldRetreat(actor);
    if (retreating) {
      const threat = nearestEnemy(actor, enemies);
      moveTo(
        combatantId,
        stepAway(
          actor.position,
          threat.position,
          stepCells,
          gridCols,
          gridRows,
        ),
      );
      actor = byId.get(combatantId)!;
      if (!isLiving(actor)) return;
    }

    let choice = selectAction(
      actor,
      livingOnSide(opposingSide(actor.side)),
      available,
    );

    if (!choice && !retreating) {
      const nearest = nearestEnemy(
        actor,
        livingOnSide(opposingSide(actor.side)),
      );
      moveTo(
        combatantId,
        stepToward(actor.position, nearest.position, stepCells),
      );
      actor = byId.get(combatantId)!;
      if (!isLiving(actor)) return;

      choice = selectAction(
        actor,
        livingOnSide(opposingSide(actor.side)),
        available,
      );
    }

    if (!choice) {
      log.push({
        kind: 'no-action',
        combatantId,
        reason: 'no-eligible-action',
      });
      return;
    }

    resolveChoice(combatantId, choice);
  };

  const takeLegendaryActions = (
    activeCombatantId: string,
    order: readonly string[],
  ) => {
    for (const id of order) {
      if (id === activeCombatantId) continue;
      const self = byId.get(id)!;
      if (!isLiving(self) || self.legendaryActionPoints <= 0) continue;

      const enemies = livingOnSide(opposingSide(self.side));
      if (!enemies.length) continue;

      const available = availableActionIds(
        self,
        usesSoFar.get(id) ?? new Map(),
      );
      const spend = spendLegendaryAction(self, enemies, available);
      if (!spend) continue;

      byId.set(id, {
        ...self,
        legendaryActionPoints: self.legendaryActionPoints - spend.cost,
      });
      resolveChoice(id, spend.choice);
    }
  };

  const order = rollInitiativeOrder();
  let round = 1;

  while (
    round <= maxRounds &&
    livingOnSide('party').length &&
    livingOnSide('monsters').length
  ) {
    log.push({ kind: 'round-start', round });
    reactionUsedThisRound = new Set();

    for (const combatantId of order) {
      if (!livingOnSide('party').length || !livingOnSide('monsters').length)
        break;

      takeTurn(combatantId);
      takeLegendaryActions(combatantId, order);
    }

    round += 1;
  }

  const partyAlive = livingOnSide('party').length > 0;
  const monstersAlive = livingOnSide('monsters').length > 0;
  const winner: EngineSide | 'draw' =
    partyAlive && !monstersAlive
      ? 'party'
      : monstersAlive && !partyAlive
        ? 'monsters'
        : 'draw';

  return {
    seed,
    winner,
    rounds: round - 1,
    log,
    combatants: input.combatants.map(original => {
      const final = byId.get(original.id)!;
      return {
        id: final.id,
        templateKey: final.templateKey,
        name: final.name,
        side: final.side,
        maxHitPoints: final.maxHitPoints,
        finalHitPoints: final.currentHitPoints,
        survived: isLiving(final),
      };
    }),
  };
};
