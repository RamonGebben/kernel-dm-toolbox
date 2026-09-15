import { parseDiceNotation, rollDice } from '~/server/simulator/engine/dice';
import { mitigateDamage } from '~/server/simulator/engine/damageMitigation';
import {
  combineConditionEffects,
  resolveRollMode,
} from '~/server/simulator/engine/conditionEffects';
import type { Rng } from '~/server/simulator/engine/rng';
import { rollD20WithMode } from '~/server/simulator/engine/rng';
import type {
  EngineAbilityModifiers,
  EngineActiveCondition,
  EngineAttack,
  EngineCombatant,
  EngineSaveEffect,
  TurnLogEntry,
} from '~/server/simulator/engine/types';

const applyDamage = (
  target: EngineCombatant,
  damage: number,
): EngineCombatant => ({
  ...target,
  currentHitPoints: Math.max(0, target.currentHitPoints - damage),
});

/**
 * Primary and extra damage (e.g. a weapon's base damage plus a bonus poison
 * die) can carry different damage types, so each is mitigated against
 * `target`'s resistances/immunities/vulnerabilities independently before
 * being summed — matching how 5e actually resolves a multi-type instance of
 * damage, not a simplification.
 */
const rollAttackDamage = (
  rng: Rng,
  attack: EngineAttack,
  isCritical: boolean,
  target: EngineCombatant,
  hasResistAll: boolean,
): number => {
  const dieMultiplier = isCritical ? 2 : 1;

  const primaryRaw = rollDice(rng, {
    count: attack.damageDieCount * dieMultiplier,
    sides: attack.damageDieType,
    bonus: attack.damageBonus,
  });
  const primary = mitigateDamage(
    primaryRaw,
    attack.damageType,
    target,
    hasResistAll,
  );

  const extraRaw = attack.extraDamageDieCount
    ? rollDice(rng, {
        count: attack.extraDamageDieCount * dieMultiplier,
        sides: attack.extraDamageDieType,
        bonus: attack.extraDamageBonus,
      })
    : 0;
  const extra = attack.extraDamageDieCount
    ? mitigateDamage(extraRaw, attack.extraDamageType, target, hasResistAll)
    : 0;

  return Math.max(0, primary + extra);
};

/** No `reach` set falls back to ranged, matching `selectAction`'s own
 * `attackRangeFeet`/`meleeAttackAction`'s "no reach or range set defaults to
 * a plain 5-foot melee attack" convention. */
const isMeleeAttack = (attack: EngineAttack): boolean =>
  attack.reach != null || attack.range == null;

/**
 * Resolves a single-target to-hit attack: d20 + `toHitMod` versus the
 * target's AC, rolled with advantage/disadvantage per the attacker's and
 * target's active conditions (issue #5, milestone 10 —
 * `combineConditionEffects`/`resolveRollMode`). A natural 20 always hits and
 * doubles the damage dice (not the flat bonus, matching 5e's actual crit
 * rule); a natural 1 always misses regardless of modifiers. A target with
 * `meleeHitsAreCritical` active (Paralyzed/Unconscious) upgrades a melee hit
 * to a critical regardless of the roll — it never grants an automatic hit,
 * only a bigger one once the attack has already landed.
 */
export const resolveAttack = (
  rng: Rng,
  attacker: Pick<EngineCombatant, 'id' | 'activeConditions'>,
  actionName: string,
  attack: EngineAttack,
  target: EngineCombatant,
): { updatedTarget: EngineCombatant; logEntry: TurnLogEntry } => {
  const attackerEffects = combineConditionEffects(attacker.activeConditions);
  const targetEffects = combineConditionEffects(target.activeConditions);
  const melee = isMeleeAttack(attack);

  const mode = resolveRollMode(
    [
      attackerEffects.advantageOnOwnAttacks,
      targetEffects.advantageOnAttacksAgainst,
      melee && targetEffects.advantageOnMeleeAttacksAgainst,
    ],
    [
      attackerEffects.disadvantageOnOwnAttacks,
      targetEffects.disadvantageOnAttacksAgainst,
      !melee && targetEffects.disadvantageOnRangedAttacksAgainst,
    ],
  );

  const roll = rollD20WithMode(rng, mode);
  const total = roll + attack.toHitMod;
  const isNatural20 = roll === 20;
  const isCriticalMiss = roll === 1;
  const hit = !isCriticalMiss && (isNatural20 || total >= target.armorClass);
  const isCritical =
    hit && (isNatural20 || (melee && targetEffects.meleeHitsAreCritical));

  const damage = hit
    ? rollAttackDamage(rng, attack, isCritical, target, targetEffects.resistAllDamage)
    : 0;

  return {
    updatedTarget: hit ? applyDamage(target, damage) : target,
    logEntry: {
      kind: 'attack',
      combatantId: attacker.id,
      targetId: target.id,
      actionName,
      attackRoll: total,
      targetArmorClass: target.armorClass,
      hit,
      critical: isCritical,
      damage,
    },
  };
};

export const saveModifierFor = (
  modifiers: EngineAbilityModifiers,
  ability: string,
): number => {
  const key = ability.toLowerCase() as keyof EngineAbilityModifiers;
  return modifiers[key] ?? 0;
};

/**
 * Resolves a save-DC action against every affected target (one for a
 * single-target effect, several for an AoE — see `selectAction`'s own
 * "circle collapses every shape" simplification for how `affected` was
 * chosen). Each target rolls independently, with disadvantage or an
 * automatic failure per its own active conditions (issue #5, milestone 10);
 * a target with no parsed `damageOnFailRoll` still rolls its save (useful
 * for a non-damaging effect this engine doesn't otherwise model) but never
 * loses hit points.
 *
 * A target that fails and `save.appliesConditionKey` is set gets that
 * condition added to its own `activeConditions` right here — a save
 * effect's condition application is entirely target-scoped (unlike ending
 * the *attacker's* previous concentration, which needs the full combatant
 * map and stays in `runEncounter.ts`'s `resolveChoice`). `requiresConcentration`
 * only tags the new condition's `concentrationSourceId`; it does not by
 * itself end any prior concentration — that's `resolveChoice`'s job, since
 * it may need to reach a combatant outside `affected` entirely.
 */
export const resolveSaveAction = (
  rng: Rng,
  attackerId: string,
  actionName: string,
  save: EngineSaveEffect,
  affected: readonly EngineCombatant[],
  requiresConcentration = false,
): {
  updatedTargets: EngineCombatant[];
  logEntry: TurnLogEntry;
  conditionEvents: TurnLogEntry[];
} => {
  const dice = save.damageOnFailRoll
    ? parseDiceNotation(save.damageOnFailRoll)
    : null;
  const conditionEvents: TurnLogEntry[] = [];

  const results = affected.map(target => {
    const targetEffects = combineConditionEffects(target.activeConditions);
    const abilityLower = save.saveAbility.toLowerCase();
    const autoFail = targetEffects.autoFailSaveAbilities.includes(abilityLower);
    const mode = resolveRollMode(
      [],
      [targetEffects.disadvantageOnSaveAbilities.includes(abilityLower)],
    );

    const rawRoll = rollD20WithMode(rng, mode);
    const roll = rawRoll + saveModifierFor(target.saveModifiers, save.saveAbility);
    const naturallyFailed = autoFail || roll < save.saveDc;
    // A creature can spend one Legendary Resistance use to turn a failed
    // save into a success (5e SRD rule) — modeled as automatic since this
    // engine has no player-facing decision point to ask "spend it?". An
    // auto-failed save (Paralyzed/Petrified/Stunned/Unconscious's own STR/
    // DEX auto-fail) can still be rescued this way — 5e doesn't exempt it.
    const usedLegendaryResistance =
      naturallyFailed && target.legendaryResistancesRemaining > 0;
    const succeeded = !naturallyFailed || usedLegendaryResistance;

    const rolledDamage = dice ? rollDice(rng, dice) : 0;
    const mitigated = mitigateDamage(
      rolledDamage,
      save.damageOnFailType,
      target,
      targetEffects.resistAllDamage,
    );
    const damage = succeeded
      ? save.halfDamageOnSave
        ? Math.floor(mitigated / 2)
        : 0
      : mitigated;

    let updated = applyDamage(target, damage);
    updated = usedLegendaryResistance
      ? {
          ...updated,
          legendaryResistancesRemaining: updated.legendaryResistancesRemaining - 1,
        }
      : updated;

    if (!succeeded && save.appliesConditionKey) {
      const newCondition: EngineActiveCondition = {
        conditionKey: save.appliesConditionKey,
        roundsRemaining: save.conditionDurationRounds ?? null,
        saveEndsEachTurn: save.conditionSaveEndsEachTurn ?? false,
        saveAbility: save.saveAbility,
        saveDc: save.saveDc,
        concentrationSourceId: requiresConcentration ? attackerId : null,
      };
      updated = {
        ...updated,
        activeConditions: [...updated.activeConditions, newCondition],
      };
      conditionEvents.push({
        kind: 'condition-applied',
        combatantId: target.id,
        conditionKey: newCondition.conditionKey,
        sourceCombatantId: attackerId,
        roundsRemaining: newCondition.roundsRemaining,
        saveEndsEachTurn: newCondition.saveEndsEachTurn,
      });
    }

    return {
      target,
      updated,
      saveRoll: roll,
      succeeded,
      usedLegendaryResistance,
      damage,
    };
  });

  return {
    updatedTargets: results.map(result => result.updated),
    conditionEvents,
    logEntry: {
      kind: 'save-effect',
      combatantId: attackerId,
      actionName,
      saveDc: save.saveDc,
      targets: results.map(result => ({
        targetId: result.target.id,
        saveRoll: result.saveRoll,
        succeeded: result.succeeded,
        usedLegendaryResistance: result.usedLegendaryResistance,
        damage: result.damage,
      })),
    },
  };
};
