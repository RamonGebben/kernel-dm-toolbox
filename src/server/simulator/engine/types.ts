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
  /**
   * Set only by `toEngineActionFromSpell` (issue #5, milestone 11): this
   * action is a spell, not a weapon attack or a monster's own action. Used
   * to exclude a spell from `EngineCombatant.attacksPerTurn`'s repeat loop
   * even when it has `attack` set (a spell attack like Fire Bolt), matching
   * 5e's rule that Extra Attack never multiplies a cast.
   */
  isSpell?: boolean;
  /**
   * The minimum spell-slot level this action consumes on use, or null for
   * anything that isn't a slot-gated spell (a cantrip, or any non-spell
   * action). Set only by `toEngineActionFromSpell`. `runEncounter.ts`
   * consumes the lowest available slot at or above this level from the
   * caster's own `EngineCombatant.spellSlotsRemaining` and treats the
   * action as unavailable when none remains — the same "gate, don't
   * pre-filter" shape `maxUsesPerEncounter` already uses, just keyed off a
   * shared pool instead of the action's own id.
   */
  requiresSpellSlotLevel?: number | null;
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
  /**
   * Remaining slots per spell level (1-9), keyed by level — issue #5,
   * milestone 11. Built once at load time from `player_character_spell_
   * slots.maxSlots` and spent at runtime by `runEncounter.ts` (lowest
   * eligible level first, mirroring `maxUsesPerEncounter`'s own "spend at
   * resolution, gate at selection" shape). Empty for every non-PC combatant
   * and for a PC with no spell slots.
   */
  spellSlotsRemaining: Record<number, number>;
  /**
   * A monster's resolved "Multiattack" sequence — which of its own
   * `actions` (by id) fire, and how many times each, when it takes the
   * Attack action — or null for a combatant with no parsed multiattack
   * (every PC, and any monster whose Multiattack prose didn't parse cleanly;
   * see `multiattackSequence`'s own schema doc comment). Resolved once at
   * load time in `loadScenarioCombatants.ts` from the raw `{actionName,
   * count}[]` the library stores, matched against this same combatant's own
   * `actions` by name — matching by id here instead avoids re-doing that
   * name lookup on every turn.
   */
  multiattackSequence: { actionId: string; count: number }[] | null;
  /**
   * Death-save eligibility (issue #5, milestone 12) — true only for PC
   * combatants. A monster keeps the pre-milestone-12 rule (0 HP = instant
   * `defeated`) rather than making individual death-save rolls, both to
   * avoid a multi-monster fight ballooning into dozens of individually
   * dying stat blocks for no balance-relevant signal, and to match "0 HP =
   * defeat" as the monster-side rule while a PC gets the fuller treatment —
   * see `runEncounter.ts`'s own doc comment.
   */
  tracksDeathSaves: boolean;
  /**
   * Where a death-save-eligible combatant is in the dying process
   * (`~/server/simulator/engine/deathSaves`). `'none'` for anyone with HP
   * above 0, and always `'none'` for a combatant with `tracksDeathSaves`
   * false. `'dying'` = at 0 HP, rolling a death save at the start of each of
   * its own turns. `'stable'` = 3 successes reached, stopped rolling, still
   * unconscious at 0 HP for the rest of the encounter (no in-combat healing
   * is modeled, so a stable combatant simply stays down). `'dead'` = 3
   * failures or an instant-death hit — permanently removed, the same
   * terminal state the `defeated` log entry already represents for a
   * monster's own 0-HP drop.
   */
  downState: 'none' | 'dying' | 'stable' | 'dead';
  deathSaveSuccesses: number;
  deathSaveFailures: number;
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
    }
  | {
      /** A death-save-eligible combatant just dropped to 0 HP and became
       * unconscious — not terminal, see `EngineCombatant.downState`'s own
       * doc comment for why this is distinct from `defeated`. */
      kind: 'down';
      combatantId: string;
      name: string;
    }
  | {
      /** One death-save event — either the roll a `dying` combatant makes
       * at the start of its own turn, or an automatic failure from taking
       * damage while already at 0 HP (issue #5, milestone 12,
       * `~/server/simulator/engine/deathSaves`). */
      kind: 'death-save';
      combatantId: string;
      /** Null for an automatic failure from taking damage at 0 HP — 5e
       * doesn't roll anything for that case, it just applies the
       * failure(s) directly. Non-null for a roll made at the start of a
       * dying combatant's own turn. */
      roll: number | null;
      /** How many failures this single event added: 2 for a natural 1 on a
       * rolled save, or for a critical hit taken while already at 0 HP; 1
       * for every other failure; 0 for a success or a natural 20. */
      failuresAdded: 0 | 1 | 2;
      /** True only for a natural 20 on a rolled save — the combatant also
       * regains 1 HP and stops dying, see the `revived` entry pushed
       * immediately after this one. */
      isNatural20: boolean;
      /** Running totals after this event. */
      successes: number;
      failures: number;
    }
  | {
      /** 3 accumulated death-save successes — stops rolling, stays
       * unconscious at 0 HP for the rest of the encounter. */
      kind: 'stabilized';
      combatantId: string;
    }
  | {
      /** A natural 20 on a death save — regains 1 HP and consciousness. */
      kind: 'revived';
      combatantId: string;
      hitPoints: number;
    };

export type EngineFinalCombatantState = {
  id: string;
  templateKey: string;
  name: string;
  side: EngineSide;
  maxHitPoints: number;
  finalHitPoints: number;
  /** For a death-save-eligible combatant (a PC), "didn't die" — a
   * stabilized or still-`dying` PC at the end of the encounter counts as
   * survived even at 0 HP, which is the balance-relevant signal for Monte
   * Carlo's `survivalRate` (issue #5, milestone 12). For anyone else, the
   * original "ended the fight above 0 HP" meaning, unchanged. See
   * `runEncounter.ts`'s own return-statement comment for why this is a
   * deliberate divergence from the encounter-end/`winner` check, which
   * still (correctly, unaffected) means "ended the fight above 0 HP" for
   * every combatant regardless of death-save eligibility. */
  survived: boolean;
};

export type EngineResult = {
  seed: number;
  winner: EngineSide | 'draw';
  rounds: number;
  log: TurnLogEntry[];
  combatants: EngineFinalCombatantState[];
};
