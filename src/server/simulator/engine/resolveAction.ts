import { parseDiceNotation, rollDice } from '~/server/simulator/engine/dice';
import { mitigateDamage } from '~/server/simulator/engine/damageMitigation';
import type { Rng } from '~/server/simulator/engine/rng';
import { rollD20 } from '~/server/simulator/engine/rng';
import type {
  EngineAbilityModifiers,
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
): number => {
  const dieMultiplier = isCritical ? 2 : 1;

  const primaryRaw = rollDice(rng, {
    count: attack.damageDieCount * dieMultiplier,
    sides: attack.damageDieType,
    bonus: attack.damageBonus,
  });
  const primary = mitigateDamage(primaryRaw, attack.damageType, target);

  const extraRaw = attack.extraDamageDieCount
    ? rollDice(rng, {
        count: attack.extraDamageDieCount * dieMultiplier,
        sides: attack.extraDamageDieType,
        bonus: attack.extraDamageBonus,
      })
    : 0;
  const extra = attack.extraDamageDieCount
    ? mitigateDamage(extraRaw, attack.extraDamageType, target)
    : 0;

  return Math.max(0, primary + extra);
};

/**
 * Resolves a single-target to-hit attack: d20 + `toHitMod` versus the
 * target's AC. A natural 20 always hits and doubles the damage dice (not
 * the flat bonus, matching 5e's actual crit rule); a natural 1 always
 * misses regardless of modifiers.
 */
export const resolveAttack = (
  rng: Rng,
  attackerId: string,
  actionName: string,
  attack: EngineAttack,
  target: EngineCombatant,
): { updatedTarget: EngineCombatant; logEntry: TurnLogEntry } => {
  const roll = rollD20(rng);
  const total = roll + attack.toHitMod;
  const isCritical = roll === 20;
  const isCriticalMiss = roll === 1;
  const hit = !isCriticalMiss && (isCritical || total >= target.armorClass);

  const damage = hit ? rollAttackDamage(rng, attack, isCritical, target) : 0;

  return {
    updatedTarget: hit ? applyDamage(target, damage) : target,
    logEntry: {
      kind: 'attack',
      combatantId: attackerId,
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

const saveModifierFor = (
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
 * chosen). Each target rolls independently; a target with no parsed
 * `damageOnFailRoll` still rolls its save (useful for a non-damaging
 * effect this engine doesn't otherwise model) but never loses hit points.
 */
export const resolveSaveAction = (
  rng: Rng,
  attackerId: string,
  actionName: string,
  save: EngineSaveEffect,
  affected: readonly EngineCombatant[],
): { updatedTargets: EngineCombatant[]; logEntry: TurnLogEntry } => {
  const dice = save.damageOnFailRoll
    ? parseDiceNotation(save.damageOnFailRoll)
    : null;

  const results = affected.map(target => {
    const roll =
      rollD20(rng) + saveModifierFor(target.saveModifiers, save.saveAbility);
    const naturallyFailed = roll < save.saveDc;
    // A creature can spend one Legendary Resistance use to turn a failed
    // save into a success (5e SRD rule) — modeled as automatic since this
    // engine has no player-facing decision point to ask "spend it?".
    const usedLegendaryResistance =
      naturallyFailed && target.legendaryResistancesRemaining > 0;
    const succeeded = !naturallyFailed || usedLegendaryResistance;

    const rolledDamage = dice ? rollDice(rng, dice) : 0;
    const mitigated = mitigateDamage(
      rolledDamage,
      save.damageOnFailType,
      target,
    );
    const damage = succeeded
      ? save.halfDamageOnSave
        ? Math.floor(mitigated / 2)
        : 0
      : mitigated;

    const updated = applyDamage(target, damage);

    return {
      target,
      updated: usedLegendaryResistance
        ? {
            ...updated,
            legendaryResistancesRemaining:
              updated.legendaryResistancesRemaining - 1,
          }
        : updated,
      saveRoll: roll,
      succeeded,
      usedLegendaryResistance,
      damage,
    };
  });

  return {
    updatedTargets: results.map(result => result.updated),
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
