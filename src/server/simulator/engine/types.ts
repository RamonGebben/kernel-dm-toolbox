import type { GridCell } from '~/server/simulator/engine/grid';

export type EngineActionType =
  'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'LEGENDARY_ACTION';

export type EngineAttack = {
  toHitMod: number;
  /** Feet. Null on a ranged-only or reach-only attack. */
  reach: number | null;
  range: number | null;
  damageDieCount: number;
  damageDieType: number;
  damageBonus: number;
  damageType: string | null;
  extraDamageDieCount: number;
  extraDamageDieType: number;
  extraDamageBonus: number;
  extraDamageType: string | null;
};

export type EngineSaveEffect = {
  /** Lowercase full ability name (`strength`, `dexterity`, …) — matches
   * `parseCreatureActionSaveArea`'s own output format. */
  saveAbility: string;
  saveDc: number;
  areaType: 'cone' | 'line' | 'sphere' | 'cube' | null;
  /** Feet. Every AoE shape here collapses to "everyone within this many
   * feet of the target" — see `resolveSaveAction`'s doc comment for why. */
  areaSize: number | null;
  /** Dice notation (`10d6`), parsed at resolution time. Null means the
   * action has save/DC data but no parsed damage — it still forces a save
   * (useful for a non-damaging effect), it just deals no damage on a fail. */
  damageOnFailRoll: string | null;
  damageOnFailType: string | null;
  halfDamageOnSave: boolean;
  /**
   * Condition applied to a target on a failed save (issue #5, milestone 10)
   * — a `ConditionKey` (`~/server/simulator/engine/conditionEffects`), or
   * null when this effect never applies a condition. Optional (rather than
   * required-but-nullable) purely so the many existing test-fixture
   * `EngineSaveEffect` literals across this directory don't all need
   * updating — `toEngineAction` always sets it explicitly for real data.
   */
  appliesConditionKey?: string | null;
  /** Hard cap in rounds from application; null = no fixed cap (see
   * `EngineActiveCondition.roundsRemaining`). */
  conditionDurationRounds?: number | null;
  /** The affected creature repeats `saveAbility`/`saveDc` at the end of each
   * of its own turns, removing the condition on a success. */
  conditionSaveEndsEachTurn?: boolean;
};

/** One condition currently affecting a combatant mid-fight — the engine's
 * own runtime tracking state, distinct from the static `conditions` library
 * table (which only carries display name/prose). */
export type EngineActiveCondition = {
  /** A `ConditionKey` — see `conditionKeyFromSlug`'s doc comment for why
   * this is the short SRD key, not the versioned `conditions.slug`. */
  conditionKey: string;
  /** Rounds remaining before this condition expires on its own; null = no
   * fixed duration (persists until removed some other way — a successful
   * `saveEndsEachTurn` roll, or its source concentration breaking). Can
   * coexist with `saveEndsEachTurn` — whichever ends it first wins. */
  roundsRemaining: number | null;
  saveEndsEachTurn: boolean;
  /** The save this condition's own `saveEndsEachTurn` check re-rolls — the
   * same ability/DC that applied it in the first place, 5e's own rule. Null
   * whenever `saveEndsEachTurn` is false. */
  saveAbility: string | null;
  saveDc: number | null;
  /** The combatant id whose concentration is maintaining this condition, if
   * any — losing that combatant's concentration (a new concentration action,
   * a failed concentration check, incapacitation, or defeat) removes this
   * condition too. Null for a condition with its own independent duration/
   * save-ends lifecycle. */
  concentrationSourceId: string | null;
};

/** What a combatant is currently concentrating on, if anything — at most one
 * per combatant (5e's own rule: starting a new one ends the last). */
export type EngineConcentration = {
  actionId: string;
  actionName: string;
};

export type EngineAction = {
  id: string;
  name: string;
  actionType: EngineActionType;
  legendaryActionCost: number | null;
  /** At most one of `attack`/`save` is set. An action with neither is
   * flavor-only (a trait-like action with no mechanical resolution this
   * engine models) and is never selected by `selectAction`. */
  attack: EngineAttack | null;
  save: EngineSaveEffect | null;
  /**
   * Total uses for the whole encounter, or null for "no limit" (a plain
   * `ACTION`/`BONUS_ACTION` with no `usesType`). Open5e's own `usesType`/
   * `usesParam` are unstructured prose ("Recharge 5-6", "1/Day") with no
   * reliable machine-parseable distinction, so this engine treats any
   * limited action as a flat per-encounter use cap rather than modeling
   * recharge-on-a-die-roll versus per-day separately — a documented
   * simplification, not an oversight.
   */
  maxUsesPerEncounter: number | null;
  /**
   * Taking this action ends whatever the actor was previously concentrating
   * on, then (if it lands a condition on at least one target — see
   * `resolveSaveAction`) becomes the actor's new concentration. Optional and
   * defaulted to falsy everywhere it's constructed today: only `spells`
   * carries a `concentration` column upstream, and spells aren't converted
   * to `EngineAction`s by `toEngineAction` yet (issue #5, milestone 11 wires
   * PC spellcasting in) — so no current data producer ever sets this true.
   * The mechanic itself is fully implemented and tested against synthetic
   * fixtures in milestone 10, ready for milestone 11 to exercise for real.
   */
  requiresConcentration?: boolean;
};

export type EngineSide = 'party' | 'monsters';

export type EngineAbilityModifiers = {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type EngineCombatant = {
  id: string;
  /** Stable across the whole run — used to report per-combatant stats in a
   * Monte Carlo summary (milestone 6) even though `id` gets a fresh value
   * seeded from React-key-friendly generation per trial. */
  templateKey: string;
  name: string;
  side: EngineSide;
  armorClass: number;
  maxHitPoints: number;
  currentHitPoints: number;
  initiativeBonus: number;
  /** Feet per move action. */
  speed: number;
  position: GridCell;
  actions: EngineAction[];
  /**
   * How many plain weapon-attack actions this combatant makes when it takes
   * the Attack action — Extra Attack and its upgrades. Always >= 1. Only
   * ever multiplies an `attack`-type resolution (`runEncounter.ts`'s
   * `takeTurn`); a `save`-type action (a spell, a breath weapon) always
   * consumes the whole turn regardless of this number, matching 5e's own
   * rule that Extra Attack doesn't apply to casting.
   *
   * Wired for PCs from `classProgression.attacksPerActionByLevel`
   * (`loadScenarioCombatants`'s `loadPartyCombatants`) — content that
   * milestone 1 hand-authored for exactly this purpose but that nothing
   * consumed until milestone 8's tuning pass caught the gap. Monsters are
   * always 1: a stat block's own "Multiattack" action is unstructured prose
   * naming which of its other named actions combine (e.g. "one bite and two
   * claws"), the same class of gap as `EngineAction.maxUsesPerEncounter`'s
   * documented recharge-die simplification — parsing that combination is
   * real follow-up work, not implemented here.
   */
  attacksPerTurn: number;
  /**
   * Per-ability save modifiers. A PC has no ability scores in this data
   * model (`player_characters` only carries AC/HP/initiative) — its
   * `initiativeModifier` stands in for every ability's save modifier as a
   * rough placeholder until ability scores exist for PCs, documented here
   * rather than silently treated as accurate.
   */
  saveModifiers: EngineAbilityModifiers;
  /** 3 for a creature with a "Legendary Resistance" trait (the SRD's
   * near-universal count), 0 otherwise — see `loadScenarioCombatants`'s
   * trait-name heuristic and its documented limits. */
  legendaryResistancesRemaining: number;
  /** 3 while any `LEGENDARY_ACTION` actions exist, 0 otherwise — refilled
   * at the start of this combatant's own turn, spent between other
   * combatants' turns by `legendaryActions.ts`. */
  legendaryActionPoints: number;
  /**
   * Lowercase damage-type slugs (`"fire"`, `"poison"`, …), matching Open5e's
   * own `damage_resistances`/`damage_immunities`/`damage_vulnerabilities`
   * arrays — consumed by `damageMitigation.ts`. Only library creatures carry
   * these structurally; `custom_creature_actions`/materialized PC data have
   * no structured resistance list yet (the schema only stores display text
   * for those two sources, per `custom_creatures`' own documented v1 scope),
   * so every non-library combatant's three lists are simply empty. Not a
   * bug — a real data-model gap left for a future milestone, same class of
   * gap as the recharge-die simplification on `EngineAction` above.
   */
  damageResistances: string[];
  damageImmunities: string[];
  damageVulnerabilities: string[];
  /** Every condition currently affecting this combatant (issue #5, milestone
   * 10) — see `EngineActiveCondition` and `combineConditionEffects`. */
  activeConditions: EngineActiveCondition[];
  /** What this combatant is concentrating on, if anything. Null for a
   * combatant that never has an action with `requiresConcentration` (every
   * combatant today, until milestone 11 wires PC spellcasting in). */
  concentratingOn: EngineConcentration | null;
};

export type EngineScenarioInput = {
  combatants: EngineCombatant[];
  gridCols?: number;
  gridRows?: number;
  /** Safety valve against an AI stalemate that never reduces either side to
   * zero — not a 5e rule, an engineering bound. */
  maxRounds?: number;
};

export type TurnLogEntry =
  | {
      kind: 'round-start';
      round: number;
    }
  | {
      kind: 'initiative';
      order: { combatantId: string; name: string; roll: number }[];
    }
  | {
      kind: 'move';
      combatantId: string;
      from: GridCell;
      to: GridCell;
    }
  | {
      kind: 'attack';
      combatantId: string;
      targetId: string;
      actionName: string;
      attackRoll: number;
      targetArmorClass: number;
      hit: boolean;
      critical: boolean;
      damage: number;
    }
  | {
      kind: 'save-effect';
      combatantId: string;
      actionName: string;
      saveDc: number;
      targets: {
        targetId: string;
        saveRoll: number;
        succeeded: boolean;
        /** True when a natural failure was overridden by spending one of
         * the target's own Legendary Resistance uses. */
        usedLegendaryResistance: boolean;
        damage: number;
      }[];
    }
  | {
      kind: 'defeated';
      combatantId: string;
      name: string;
    }
  | {
      kind: 'no-action';
      combatantId: string;
      reason: 'no-living-enemies' | 'no-eligible-action' | 'incapacitated';
    }
  | {
      kind: 'condition-applied';
      combatantId: string;
      conditionKey: string;
      sourceCombatantId: string;
      roundsRemaining: number | null;
    }
  | {
      kind: 'condition-removed';
      combatantId: string;
      conditionKey: string;
      reason: 'expired' | 'save-succeeded' | 'concentration-broken';
    }
  | {
      kind: 'concentration-check';
      combatantId: string;
      damage: number;
      dc: number;
      roll: number;
      succeeded: boolean;
    };

export type EngineFinalCombatantState = {
  id: string;
  templateKey: string;
  name: string;
  side: EngineSide;
  maxHitPoints: number;
  finalHitPoints: number;
  survived: boolean;
};

export type EngineResult = {
  seed: number;
  winner: EngineSide | 'draw';
  rounds: number;
  log: TurnLogEntry[];
  combatants: EngineFinalCombatantState[];
};
