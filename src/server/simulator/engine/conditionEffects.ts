import type { EngineActiveCondition } from '~/server/simulator/engine/types';

/** The fifteen 2024 SRD condition keys, matching `conditions.key` exactly
 * (see `conditionKeyFromSlug`'s own doc comment for how a stored
 * `appliesConditionSlug` value gets down to one of these). */
export type ConditionKey =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious';

/**
 * The mechanical surface this engine's dice/movement resolution actually
 * reads. Not a 1:1 transcription of every SRD condition rule (e.g. Prone's
 * "costs half your movement to stand up" isn't modeled — this engine has no
 * concept of a combatant choosing to spend part of a turn standing rather
 * than acting, only a flat move-then-act structure) — just the subset that
 * changes a roll, a hit, a save, or whether a turn happens at all.
 */
export type ConditionEffects = {
  /** No actions, reactions, or movement — matches 5e's Incapacitated rule
   * bundle (which Paralyzed/Petrified/Stunned/Unconscious all include by
   * reference). Also ends concentration immediately (2024 SRD rule). */
  incapacitates: boolean;
  /** Speed treated as 0 for movement purposes. */
  speedZero: boolean;
  disadvantageOnOwnAttacks: boolean;
  advantageOnOwnAttacks: boolean;
  /** Every attack roll against this creature, melee or ranged. */
  advantageOnAttacksAgainst: boolean;
  disadvantageOnAttacksAgainst: boolean;
  /** Prone's asymmetric rule — melee attacks against get advantage, ranged
   * get disadvantage — kept separate from the flat fields above since it
   * depends on the attacker's own attack type. */
  advantageOnMeleeAttacksAgainst: boolean;
  disadvantageOnRangedAttacksAgainst: boolean;
  /** A hit from within melee reach is an automatic critical (5e's Paralyzed/
   * Unconscious rule) — upgrades a hit to a crit, never grants an automatic
   * hit; see `resolveAttack`. */
  meleeHitsAreCritical: boolean;
  /** Resistance to all damage types regardless of the target's own
   * resistance list (Petrified). */
  resistAllDamage: boolean;
  /** Lowercase ability names this creature automatically fails a save for,
   * no roll needed. */
  autoFailSaveAbilities: readonly string[];
  /** Lowercase ability names this creature has disadvantage on saves for. */
  disadvantageOnSaveAbilities: readonly string[];
};

const EMPTY_EFFECTS: ConditionEffects = {
  incapacitates: false,
  speedZero: false,
  disadvantageOnOwnAttacks: false,
  advantageOnOwnAttacks: false,
  advantageOnAttacksAgainst: false,
  disadvantageOnAttacksAgainst: false,
  advantageOnMeleeAttacksAgainst: false,
  disadvantageOnRangedAttacksAgainst: false,
  meleeHitsAreCritical: false,
  resistAllDamage: false,
  autoFailSaveAbilities: [],
  disadvantageOnSaveAbilities: [],
};

/** Paralyzed/Petrified/Stunned/Unconscious all fold in Incapacitated's own
 * effects (no action/reaction/movement) plus auto-failed STR/DEX saves and
 * advantage for anyone attacking them — the shared "helpless" bundle 5e
 * defines once and reuses across all four. */
const HELPLESS: Pick<
  ConditionEffects,
  'incapacitates' | 'speedZero' | 'autoFailSaveAbilities' | 'advantageOnAttacksAgainst'
> = {
  incapacitates: true,
  speedZero: true,
  autoFailSaveAbilities: ['strength', 'dexterity'],
  advantageOnAttacksAgainst: true,
};

/**
 * Hand-authored per-condition mechanical rules, keyed by the SRD's short
 * `key` (not the versioned `conditions.slug`) — same "authored content, not
 * parsed" treatment as `classProgression`, since a condition's rules text is
 * prose no parser should be trusted to turn into game logic.
 *
 * Charmed and Deafened are real, deliberate no-ops: both are purely social/
 * perception rules in 5e (charmed affects persuasion-type interactions and
 * a restriction on the charmer being attacked by the charmed creature — this
 * engine has no such social-action modeling; deafened only affects hearing-
 * based checks) with no effect on attack rolls, saves, AC, or damage — the
 * only levers this combat engine has. Exhaustion is also a documented no-op:
 * the 2024 SRD's single-track, stacking-penalty version needs a numeric
 * level (not just "present/absent") this schema has nowhere to store yet —
 * real follow-up work, not an oversight.
 */
export const CONDITION_EFFECTS: Record<ConditionKey, ConditionEffects> = {
  blinded: {
    ...EMPTY_EFFECTS,
    disadvantageOnOwnAttacks: true,
    advantageOnAttacksAgainst: true,
  },
  charmed: EMPTY_EFFECTS,
  deafened: EMPTY_EFFECTS,
  exhaustion: EMPTY_EFFECTS,
  frightened: {
    ...EMPTY_EFFECTS,
    // Simplified from "while the source of fear is within line of sight":
    // this engine has no line-of-sight geometry, so the penalty applies for
    // as long as the condition itself is active rather than being
    // re-evaluated per line of sight each turn.
    disadvantageOnOwnAttacks: true,
  },
  grappled: {
    ...EMPTY_EFFECTS,
    speedZero: true,
  },
  incapacitated: {
    ...EMPTY_EFFECTS,
    incapacitates: true,
  },
  invisible: {
    ...EMPTY_EFFECTS,
    advantageOnOwnAttacks: true,
    disadvantageOnAttacksAgainst: true,
  },
  paralyzed: {
    ...EMPTY_EFFECTS,
    ...HELPLESS,
    meleeHitsAreCritical: true,
  },
  petrified: {
    ...EMPTY_EFFECTS,
    ...HELPLESS,
    resistAllDamage: true,
  },
  poisoned: {
    ...EMPTY_EFFECTS,
    disadvantageOnOwnAttacks: true,
  },
  prone: {
    ...EMPTY_EFFECTS,
    disadvantageOnOwnAttacks: true,
    advantageOnMeleeAttacksAgainst: true,
    disadvantageOnRangedAttacksAgainst: true,
  },
  restrained: {
    ...EMPTY_EFFECTS,
    speedZero: true,
    disadvantageOnOwnAttacks: true,
    advantageOnAttacksAgainst: true,
    disadvantageOnSaveAbilities: ['dexterity'],
  },
  stunned: {
    ...EMPTY_EFFECTS,
    ...HELPLESS,
  },
  unconscious: {
    ...EMPTY_EFFECTS,
    ...HELPLESS,
    meleeHitsAreCritical: true,
  },
};

const union = (a: readonly string[], b: readonly string[]): string[] => [
  ...new Set([...a, ...b]),
];

/** Folds every active condition on one combatant into one effective set —
 * any single condition granting a boolean effect is enough to grant it
 * overall (conditions never cancel each other out in 5e; advantage/
 * disadvantage cancellation between *different* sources, e.g. blinded vs.
 * invisible, is handled by `resolveRollMode`, not here). */
export const combineConditionEffects = (
  activeConditions: readonly EngineActiveCondition[],
): ConditionEffects =>
  activeConditions.reduce((acc, condition) => {
    const effects =
      CONDITION_EFFECTS[condition.conditionKey as ConditionKey] ??
      EMPTY_EFFECTS;
    return {
      incapacitates: acc.incapacitates || effects.incapacitates,
      speedZero: acc.speedZero || effects.speedZero,
      disadvantageOnOwnAttacks:
        acc.disadvantageOnOwnAttacks || effects.disadvantageOnOwnAttacks,
      advantageOnOwnAttacks:
        acc.advantageOnOwnAttacks || effects.advantageOnOwnAttacks,
      advantageOnAttacksAgainst:
        acc.advantageOnAttacksAgainst || effects.advantageOnAttacksAgainst,
      disadvantageOnAttacksAgainst:
        acc.disadvantageOnAttacksAgainst ||
        effects.disadvantageOnAttacksAgainst,
      advantageOnMeleeAttacksAgainst:
        acc.advantageOnMeleeAttacksAgainst ||
        effects.advantageOnMeleeAttacksAgainst,
      disadvantageOnRangedAttacksAgainst:
        acc.disadvantageOnRangedAttacksAgainst ||
        effects.disadvantageOnRangedAttacksAgainst,
      meleeHitsAreCritical:
        acc.meleeHitsAreCritical || effects.meleeHitsAreCritical,
      resistAllDamage: acc.resistAllDamage || effects.resistAllDamage,
      autoFailSaveAbilities: union(
        acc.autoFailSaveAbilities,
        effects.autoFailSaveAbilities,
      ),
      disadvantageOnSaveAbilities: union(
        acc.disadvantageOnSaveAbilities,
        effects.disadvantageOnSaveAbilities,
      ),
    };
  }, EMPTY_EFFECTS);

/** Advantage and disadvantage from different sources cancel out to a
 * `'normal'` roll — 5e's own rule for combining multiple d20-roll
 * modifiers, regardless of how many sources contributed each side. */
export const resolveRollMode = (
  advantageFlags: readonly boolean[],
  disadvantageFlags: readonly boolean[],
): 'normal' | 'advantage' | 'disadvantage' => {
  const hasAdvantage = advantageFlags.some(Boolean);
  const hasDisadvantage = disadvantageFlags.some(Boolean);
  if (hasAdvantage && hasDisadvantage) return 'normal';
  if (hasAdvantage) return 'advantage';
  if (hasDisadvantage) return 'disadvantage';
  return 'normal';
};

/**
 * `appliesConditionSlug` stores the full upstream `conditions.slug`
 * (`srd-2024_paralyzed`, versioned by import document) since that's what the
 * column's FK requires — but this engine's condition rules are authored
 * against the SRD's stable short `key` (`paralyzed`), not tied to any one
 * document revision. A condition slug is always `<document>_<key>` with no
 * internal underscores in the key itself (verified against the real
 * imported SRD-2024 `conditions` table), so the segment after the last
 * underscore recovers the key without needing a DB join at read time.
 */
export const conditionKeyFromSlug = (slug: string): string =>
  slug.split('_').at(-1) ?? slug;
