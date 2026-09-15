import { rollInitiative } from '~/utils/rollDice';
import { createRng, rollDie, rollD20 } from '~/server/simulator/engine/rng';
import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
  chebyshevDistanceFeet,
  stepAway,
  stepToward,
  type GridCell,
} from '~/server/simulator/engine/grid';
import {
  chooseTarget,
  nearestEnemy,
  selectAction,
} from '~/server/simulator/engine/selectAction';
import {
  resolveAttack,
  resolveSaveAction,
  saveModifierFor,
} from '~/server/simulator/engine/resolveAction';
import { spendLegendaryAction } from '~/server/simulator/engine/legendaryActions';
import { shouldRetreat } from '~/server/simulator/engine/retreat';
import { combineConditionEffects } from '~/server/simulator/engine/conditionEffects';
import {
  consumeLowestSlot,
  hasAvailableSlot,
} from '~/server/simulator/engine/spellSlots';
import {
  applyDamageForDeathSaves,
  rollDeathSave,
} from '~/server/simulator/engine/deathSaves';
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

/** Every action a combatant hasn't exhausted this encounter yet — a flat
 * per-action use cap (`maxUsesPerEncounter`, e.g. a recharge ability) or, for
 * a spell (issue #5, milestone 11), whether any slot at or above its own
 * `requiresSpellSlotLevel` still has uses left in the caster's shared pool. A
 * cantrip (`requiresSpellSlotLevel` null) is ungated by slots either way. */
const availableActionIds = (
  combatant: EngineCombatant,
  usesSoFar: ReadonlyMap<string, number>,
): Set<string> =>
  new Set(
    combatant.actions
      .filter(
        action =>
          (action.maxUsesPerEncounter === null ||
            (usesSoFar.get(action.id) ?? 0) < action.maxUsesPerEncounter) &&
          (action.requiresSpellSlotLevel == null ||
            hasAvailableSlot(
              combatant.spellSlotsRemaining,
              action.requiresSpellSlotLevel,
            )),
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
 * Modeled, per issue #5 milestone 4's scope (plus Extra Attack, added in
 * milestone 8's tuning pass — see `EngineCombatant.attacksPerTurn`'s own doc
 * comment): initiative, movement, Int-driven/HP-threshold-retreat targeting
 * AI (`selectAction`/`retreat.ts`), to-hit attacks and DC saves
 * (`resolveAction.ts`), a combatant repeating a plain weapon attack up to
 * `attacksPerTurn` times in one turn (never a spell/save action, which
 * always consumes the whole turn), AoE (collapsed to a "within N feet"
 * circle — see `selectAction`'s own doc comment), damage type resistance/
 * immunity/vulnerability (`damageMitigation.ts`), legendary actions and
 * legendary resistance, a flat per-encounter use cap standing in for
 * recharge dice (see `EngineAction.maxUsesPerEncounter`'s doc comment), and
 * opportunity attacks on any move that leaves a threatening enemy's reach.
 *
 * Also modeled, added in the issue's second-wave milestone 10 once
 * `appliesConditionSlug`/`conditionDurationRounds`/`conditionSaveEndsEachTurn`
 * gave a save effect somewhere to attach a status to (milestone 9):
 * conditions — all fifteen 2024 SRD conditions, hand-authored mechanical
 * rules in `conditionEffects.ts` (incapacitation, speed 0, advantage/
 * disadvantage on attacks and saves, auto-failed STR/DEX saves, forced
 * critical hits, resistance to all damage), applied on a failed save,
 * ticked once per round for a fixed duration and/or re-saved at the end of
 * the affected creature's own turn — and concentration — one effect per
 * caster, broken by starting a new one, failing a CON save on taking damage
 * (`DC = max(10, floor(damage / 2))`), becoming incapacitated, or dying.
 * The concentration mechanic is fully wired but not yet exercised by any
 * real action: only `spells.concentration` carries this flag upstream, and
 * spells aren't converted to `EngineAction`s yet — see
 * `EngineAction.requiresConcentration`'s own doc comment. Milestone 11 (PC
 * spellcasting) is what will actually set it to true for real data.
 *
 * Also modeled, milestone 12: death saving throws, PC-only
 * (`EngineCombatant.tracksDeathSaves` — see `deathSaves.ts`). A monster
 * still dies outright at 0 HP, unchanged. A PC instead becomes unconscious
 * and enters a `dying` state: a flat, unmodified d20 rolled at the start of
 * each of its own turns (10+ succeeds, a natural 1 counts as two failures,
 * a natural 20 restores 1 HP and consciousness), 3 successes stabilizes it
 * (stops rolling, stays down at 0 HP for the rest of the encounter — no
 * in-combat healing is modeled), 3 failures kills it. Taking damage while
 * already down adds one automatic failure (two on a critical hit) on top of
 * that same roll-each-turn process; a hit whose damage, past what was
 * needed to reach 0 HP, equals or exceeds the PC's own max HP kills it
 * instantly by 5e's massive-damage rule, no saves rolled at all. The
 * encounter-end/`winner` check needed no change for this: it already asks
 * "does either side have anyone above 0 HP," which a dying or stable PC
 * (always at exactly 0) correctly fails without knowing anything about
 * `downState` — see `EngineFinalCombatantState.survived`'s own doc comment
 * for the one place this milestone *did* need a deliberate, separate
 * definition of "made it through the fight."
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

  /**
   * Removes `combatantId`'s current concentration (if any) and every active
   * condition tied to it — on any other combatant, since a maintained
   * control effect almost always lives on an enemy, not the caster. Called
   * before starting a new concentration action (5e: casting one always ends
   * the last, success or not), on a failed concentration check, on the
   * caster becoming incapacitated, and on the caster's own defeat.
   */
  const breakConcentration = (combatantId: string) => {
    const caster = byId.get(combatantId);
    if (!caster?.concentratingOn) return;

    for (const [id, combatant] of byId) {
      const tied = combatant.activeConditions.filter(
        condition => condition.concentrationSourceId === combatantId,
      );
      if (!tied.length) continue;

      byId.set(id, {
        ...combatant,
        activeConditions: combatant.activeConditions.filter(
          condition => condition.concentrationSourceId !== combatantId,
        ),
      });
      tied.forEach(condition =>
        log.push({
          kind: 'condition-removed',
          combatantId: id,
          conditionKey: condition.conditionKey,
          reason: 'concentration-broken',
        }),
      );
    }

    byId.set(combatantId, { ...byId.get(combatantId)!, concentratingOn: null });
  };

  /** A concentrating combatant that takes damage rolls a CON save (DC =
   * `max(10, floor(damage / 2))`, 5e's own formula) or loses concentration —
   * called after every damage application, a no-op for anyone not
   * concentrating or who took no damage. */
  const maybeCheckConcentration = (combatantId: string, damage: number) => {
    if (damage <= 0) return;
    const target = byId.get(combatantId);
    if (!target?.concentratingOn) return;

    const dc = Math.max(10, Math.floor(damage / 2));
    const roll =
      rollD20(rng) + saveModifierFor(target.saveModifiers, 'constitution');
    const succeeded = roll >= dc;
    log.push({
      kind: 'concentration-check',
      combatantId,
      damage,
      dc,
      roll,
      succeeded,
    });
    if (!succeeded) breakConcentration(combatantId);
  };

  /**
   * The single funnel every damage-dealing resolution routes through to
   * commit its updated target, run the death-save state machine (issue #5,
   * milestone 12, `deathSaves.ts`) for a death-save-eligible combatant, run
   * a concentration check, and push whichever terminal/transition log
   * entries the result calls for. `isCriticalHit` only matters for an
   * already-down combatant taking more damage (5e: a critical hit while at
   * 0 HP counts as two automatic death-save failures instead of one) — a
   * save-effect's damage never crits, so its call site simply omits it.
   */
  const applyUpdate = (
    updated: EngineCombatant,
    damageDealt = 0,
    isCriticalHit = false,
  ) => {
    const previous = byId.get(updated.id)!;
    const wasLiving = isLiving(previous);

    const { combatant: next, events: deathSaveEvents } =
      applyDamageForDeathSaves(previous, updated, damageDealt, isCriticalHit);
    byId.set(next.id, next);
    deathSaveEvents.forEach(event => log.push(event));

    // A concentration check is only meaningful when concentration might
    // actually continue — a combatant that just dropped to 0 HP or below
    // loses it unconditionally (incapacitation, or death) regardless of any
    // roll, so skip the check entirely rather than logging a "maintains
    // concentration" that's immediately contradicted by the down/defeated
    // entry right after it.
    if (isLiving(next)) maybeCheckConcentration(next.id, damageDealt);

    const justWentDown = wasLiving && !isLiving(next);
    const justDied = previous.downState !== 'dead' && next.downState === 'dead';

    // Entered the dying state this hit (not terminal) — concentration still
    // breaks (dropping to 0 HP/becoming incapacitated always ends it), but
    // no `defeated` entry: the `down` event already pushed above is the
    // right signal for this transition.
    if (justWentDown && next.tracksDeathSaves && next.downState !== 'dead') {
      breakConcentration(next.id);
      return;
    }

    // Either a death-save-ineligible combatant dropped to 0 (the pre-
    // milestone-12 instant-defeat rule, unchanged), or a death-save-
    // eligible one died outright this same event (massive damage, or the
    // 3rd automatic failure from being hit while already down) — both are
    // the single terminal `defeated` signal, matching every consumer that
    // already reads it (kill attribution, the battle-viewer canvas).
    if (justWentDown || justDied) {
      log.push({ kind: 'defeated', combatantId: next.id, name: next.name });
      breakConcentration(next.id);
    }
  };

  const resolveChoice = (
    actorId: string,
    choice: ReturnType<typeof selectAction>,
  ) => {
    if (!choice) return;
    recordUse(actorId, choice.action.id);

    // Spending a spell slot (issue #5, milestone 11) is a shared-pool
    // deduction, not the per-action `usesSoFar` bookkeeping `recordUse`
    // already does above — a cantrip (`requiresSpellSlotLevel` null) never
    // reaches this branch.
    if (choice.action.requiresSpellSlotLevel != null) {
      const actorNow = byId.get(actorId)!;
      byId.set(actorId, {
        ...actorNow,
        spellSlotsRemaining: consumeLowestSlot(
          actorNow.spellSlotsRemaining,
          choice.action.requiresSpellSlotLevel,
        ),
      });
    }

    if (choice.action.attack) {
      // Same rule as the save branch below: casting a new concentration
      // action always ends whatever this actor was concentrating on before,
      // success or failure — an attack-roll concentration spell (e.g. Witch
      // Bolt) reaches this branch, not the save branch, so it needs the same
      // handling.
      if (choice.action.requiresConcentration) breakConcentration(actorId);

      const { updatedTarget, logEntry } = resolveAttack(
        rng,
        byId.get(actorId)!,
        choice.action.name,
        choice.action.attack,
        byId.get(choice.target.id)!,
      );
      log.push(logEntry);
      applyUpdate(
        updatedTarget,
        logEntry.kind === 'attack' && logEntry.hit ? logEntry.damage : 0,
        logEntry.kind === 'attack' && logEntry.critical,
      );

      // Concentration begins the moment the spell is cast, independent of
      // whether the attack roll actually hits — unless the actor didn't
      // survive resolving its own attack somehow (not currently possible,
      // but `isLiving` keeps this consistent with the save branch).
      if (choice.action.requiresConcentration) {
        const actorNow = byId.get(actorId)!;
        if (isLiving(actorNow)) {
          byId.set(actorId, {
            ...actorNow,
            concentratingOn: {
              actionId: choice.action.id,
              actionName: choice.action.name,
            },
          });
        }
      }
      return;
    }

    if (choice.action.save) {
      // Casting a new concentration action always ends whatever this actor
      // was concentrating on before, success or failure — 5e's own rule.
      if (choice.action.requiresConcentration) breakConcentration(actorId);

      const affected = choice.affected.map(c => byId.get(c.id)!);
      const { updatedTargets, logEntry, conditionEvents } = resolveSaveAction(
        rng,
        actorId,
        choice.action.name,
        choice.action.save,
        affected,
        choice.action.requiresConcentration,
      );
      log.push(logEntry);
      conditionEvents.forEach(event => log.push(event));
      updatedTargets.forEach(target => {
        const damageDealt =
          logEntry.kind === 'save-effect'
            ? (logEntry.targets.find(t => t.targetId === target.id)?.damage ??
              0)
            : 0;
        applyUpdate(target, damageDealt);
      });

      // Only start tracking a new concentration effect if this cast
      // actually landed something to maintain (a condition on at least one
      // target) — a concentration spell whose save was fully resisted has
      // nothing left for this engine to track as ongoing.
      if (choice.action.requiresConcentration) {
        const landedCondition = updatedTargets.some(target =>
          target.activeConditions.some(
            condition => condition.concentrationSourceId === actorId,
          ),
        );
        if (landedCondition) {
          const actorNow = byId.get(actorId)!;
          byId.set(actorId, {
            ...actorNow,
            concentratingOn: {
              actionId: choice.action.id,
              actionName: choice.action.name,
            },
          });
        }
      }
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
      enemy =>
        !reactionUsedThisRound.has(enemy.id) &&
        !combineConditionEffects(enemy.activeConditions).incapacitates,
    );

    for (const enemy of threats) {
      const meleeAction = meleeAttackAction(enemy);
      if (!meleeAction?.attack) continue;

      // A limited-use melee action (e.g. a recharge ability) is just as
      // capped when triggered as an opportunity attack as it is on the
      // combatant's own turn — gate on the same per-encounter use tracking
      // `availableActionIds` already enforces everywhere else.
      const available = availableActionIds(
        enemy,
        usesSoFar.get(enemy.id) ?? new Map(),
      );
      if (!available.has(meleeAction.id)) continue;

      const reach = meleeAction.attack.reach ?? DEFAULT_MELEE_REACH_FEET;
      const wasInReach = chebyshevDistanceFeet(enemy.position, from) <= reach;
      const stillInReach = chebyshevDistanceFeet(enemy.position, to) <= reach;
      if (!wasInReach || stillInReach) continue;

      reactionUsedThisRound.add(enemy.id);
      const target = byId.get(moverId);
      if (!target || !isLiving(target)) continue;

      recordUse(enemy.id, meleeAction.id);
      const { updatedTarget, logEntry } = resolveAttack(
        rng,
        enemy,
        `${meleeAction.name} (opportunity attack)`,
        meleeAction.attack,
        target,
      );
      log.push(logEntry);
      applyUpdate(
        updatedTarget,
        logEntry.kind === 'attack' && logEntry.hit ? logEntry.damage : 0,
        logEntry.kind === 'attack' && logEntry.critical,
      );
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

  /**
   * Resolves a monster's parsed Multiattack (issue #5, milestone 11) as its
   * own named sub-attacks in order — e.g. bite×1, claw×2 resolves as three
   * separate `resolveAttack` calls against their own named actions, not
   * three repeats of one. Keeps attacking `initialTarget` across the whole
   * sequence unless it's defeated partway through, in which case the
   * remaining sub-attacks reselect a target via the same Int-driven
   * `chooseTarget` every other choice in this engine uses. An `actionId` in
   * the sequence that doesn't match any of `combatantId`'s own `attack`
   * actions (shouldn't happen given `parseMultiattackSequence`'s own
   * validation, but this engine never trusts parsed data that far) is
   * skipped rather than crashing the whole turn.
   */
  const resolveMultiattack = (
    combatantId: string,
    sequence: readonly { actionId: string; count: number }[],
    initialTarget: EngineCombatant,
  ) => {
    let targetId = initialTarget.id;

    for (const { actionId, count } of sequence) {
      const action = byId
        .get(combatantId)!
        .actions.find(a => a.id === actionId);
      if (!action?.attack) continue;

      for (let i = 0; i < count; i += 1) {
        if (!isLiving(byId.get(combatantId)!)) return;

        // A sub-action inside a Multiattack sequence is still subject to its
        // own per-encounter use cap, the same as every other action-
        // selection path in this engine — stop repeating this sub-action
        // (but let the rest of the sequence continue) once it's exhausted.
        if (
          action.maxUsesPerEncounter !== null &&
          (usesSoFar.get(combatantId)?.get(actionId) ?? 0) >=
            action.maxUsesPerEncounter
        ) {
          break;
        }

        const enemies = livingOnSide(opposingSide(byId.get(combatantId)!.side));
        if (!enemies.length) return;

        let target = byId.get(targetId);
        if (!target || !isLiving(target)) {
          target = chooseTarget(byId.get(combatantId)!, enemies);
          targetId = target.id;
        }

        recordUse(combatantId, actionId);
        const { updatedTarget, logEntry } = resolveAttack(
          rng,
          byId.get(combatantId)!,
          action.name,
          action.attack,
          target,
        );
        log.push(logEntry);
        applyUpdate(
          updatedTarget,
          logEntry.kind === 'attack' && logEntry.hit ? logEntry.damage : 0,
          logEntry.kind === 'attack' && logEntry.critical,
        );
      }
    }
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

    // A `dying` combatant's "turn" is just the death save it rolls at the
    // start of it (issue #5, milestone 12) — no action, no movement, no
    // legendary-point refill. `breakConcentration` isn't needed here even
    // on a death here: concentration already broke the moment this
    // combatant first dropped to 0 HP (`applyUpdate`'s `justWentDown`
    // branch), so it's already null by the time this can run.
    if (self.downState === 'dying') {
      const { combatant: rolled, events } = rollDeathSave(rng, self);
      byId.set(combatantId, rolled);
      events.forEach(event => log.push(event));
      if (rolled.downState === 'dead') {
        log.push({ kind: 'defeated', combatantId, name: rolled.name });
      }
      return;
    }

    // `stable`/`dead` (already-out) or a plain non-eligible defeat all fall
    // through to the pre-existing "nothing to do" skip.
    if (!isLiving(self)) return;

    if (self.actions.some(action => action.actionType === 'LEGENDARY_ACTION')) {
      byId.set(combatantId, {
        ...self,
        legendaryActionPoints: LEGENDARY_ACTION_POINTS_PER_ROUND,
      });
    }

    let actor = byId.get(combatantId)!;

    // A helpless/incapacitated combatant (Paralyzed, Petrified, Stunned,
    // Unconscious, or a plain Incapacitated effect) takes no action, no
    // reaction, and doesn't move — the legendary-point refill above still
    // happens since that's just bookkeeping for other creatures' turns.
    if (combineConditionEffects(actor.activeConditions).incapacitates) {
      log.push({ kind: 'no-action', combatantId, reason: 'incapacitated' });
      return;
    }

    const enemies = livingOnSide(opposingSide(actor.side));
    if (!enemies.length) return;

    const available = availableActionIds(
      actor,
      usesSoFar.get(combatantId) ?? new Map(),
    );
    const effectiveSpeed = combineConditionEffects(actor.activeConditions)
      .speedZero
      ? 0
      : actor.speed;
    const stepCells = Math.max(0, Math.floor(effectiveSpeed / 5));

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

    // A resolved Multiattack (issue #5, milestone 11) overrides the plain
    // Extra Attack repeat below entirely — but only when the AI actually
    // chose to attack this turn. `selectAction`'s own priority (an AoE save
    // action first when it would hit 2+ enemies, otherwise the nearest usable
    // attack) already decides "breath weapon or claws this round," so
    // checking `choice.action.attack` here is enough to respect that instead
    // of second-guessing it.
    if (actor.multiattackSequence?.length && choice.action.attack) {
      resolveMultiattack(combatantId, actor.multiattackSequence, choice.target);
      return;
    }

    // Extra Attack (`EngineCombatant.attacksPerTurn`, see its own doc
    // comment): a plain `attack`-type choice can repeat up to that many
    // times in one turn; a `save`-type choice (a spell, a breath weapon)
    // always consumes the whole turn and never chains into another attempt.
    // A spell mapped to `attack` (a cantrip like Fire Bolt) is excluded the
    // same way even though it technically has `.attack` set — 5e's own rule
    // that Extra Attack never multiplies a cast (`EngineAction.isSpell`'s own
    // doc comment).
    let attacksMade = 0;
    let current: ReturnType<typeof selectAction> = choice;
    while (current) {
      resolveChoice(combatantId, current);
      attacksMade += 1;
      if (!current.action.attack || current.action.isSpell) break;
      if (!isLiving(byId.get(combatantId)!)) break;
      if (attacksMade >= actor.attacksPerTurn) break;

      const remainingEnemies = livingOnSide(opposingSide(actor.side));
      if (!remainingEnemies.length) break;

      current = selectAction(
        byId.get(combatantId)!,
        remainingEnemies,
        availableActionIds(
          byId.get(combatantId)!,
          usesSoFar.get(combatantId) ?? new Map(),
        ),
      );
      if (current && (!current.action.attack || current.action.isSpell)) break;
    }
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

  /** Decrements every living combatant's timed conditions by one round,
   * removing any that hit zero — run once at the start of each round.
   * Conditions with no `roundsRemaining` cap (null) are untouched here;
   * they only end via a successful `saveEndsEachTurn` roll or their source
   * concentration breaking. A duration expiring doesn't itself touch
   * `concentratingOn` — the caster may still be narratively concentrating on
   * a spell whose mechanical effect just timed out, a documented
   * simplification for the rare case a concentration effect also carries a
   * hard round cap. */
  const tickRoundDurations = () => {
    for (const [id, combatant] of byId) {
      if (!isLiving(combatant) || !combatant.activeConditions.length) continue;

      const remaining: typeof combatant.activeConditions = [];
      const expired: typeof combatant.activeConditions = [];
      for (const condition of combatant.activeConditions) {
        if (condition.roundsRemaining === null) {
          remaining.push(condition);
          continue;
        }
        const next = condition.roundsRemaining - 1;
        if (next <= 0) expired.push(condition);
        else remaining.push({ ...condition, roundsRemaining: next });
      }

      // Always write back — even when nothing expired this round, a timed
      // condition's `roundsRemaining` still needs to persist its decrement
      // for the next round to tick from.
      byId.set(id, { ...combatant, activeConditions: remaining });
      expired.forEach(condition =>
        log.push({
          kind: 'condition-removed',
          combatantId: id,
          conditionKey: condition.conditionKey,
          reason: 'expired',
        }),
      );
    }
  };

  /** Re-rolls every `saveEndsEachTurn` condition still on `combatantId`,
   * removing it on a success — 5e's "repeats the save at the end of each of
   * its turns" rule. Called right after that combatant's own turn. */
  const checkSaveEndsConditions = (combatantId: string) => {
    const combatant = byId.get(combatantId);
    if (
      !combatant ||
      !isLiving(combatant) ||
      !combatant.activeConditions.length
    )
      return;

    const remaining: typeof combatant.activeConditions = [];
    const removed: typeof combatant.activeConditions = [];
    for (const condition of combatant.activeConditions) {
      if (
        !condition.saveEndsEachTurn ||
        !condition.saveAbility ||
        condition.saveDc === null
      ) {
        remaining.push(condition);
        continue;
      }
      const roll =
        rollD20(rng) +
        saveModifierFor(combatant.saveModifiers, condition.saveAbility);
      if (roll >= condition.saveDc) removed.push(condition);
      else remaining.push(condition);
    }

    if (!removed.length) return;
    byId.set(combatantId, { ...combatant, activeConditions: remaining });
    removed.forEach(condition =>
      log.push({
        kind: 'condition-removed',
        combatantId,
        conditionKey: condition.conditionKey,
        reason: 'save-succeeded',
      }),
    );
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
    tickRoundDurations();

    for (const combatantId of order) {
      if (!livingOnSide('party').length || !livingOnSide('monsters').length)
        break;

      takeTurn(combatantId);
      takeLegendaryActions(combatantId, order);
      checkSaveEndsConditions(combatantId);
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
        // For a death-save-eligible combatant, "survived" means "didn't
        // die" rather than "ended the fight above 0 HP" — a stabilized or
        // still-dying PC lived to tell the tale even though they didn't end
        // the encounter on their feet, which is the balance-relevant signal
        // for Monte Carlo's `survivalRate` (issue #5, milestone 12). This
        // is a deliberate divergence from `winner`/the encounter-end loop
        // above, both of which correctly keep using HP > 0 (`isLiving`) as
        // "can this side still fight" — unaffected by this change, since
        // `downState` never influences those. A non-eligible combatant
        // (a monster) keeps the original HP-based meaning unchanged.
        survived: final.tracksDeathSaves
          ? final.downState !== 'dead'
          : isLiving(final),
      };
    }),
  };
};
