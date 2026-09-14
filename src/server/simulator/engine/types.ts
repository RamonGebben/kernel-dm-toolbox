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
      reason: 'no-living-enemies' | 'no-eligible-action';
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
