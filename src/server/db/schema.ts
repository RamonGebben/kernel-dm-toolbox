import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  real,
  check,
} from 'drizzle-orm/sqlite-core';

/**
 * Every table in this app spreads `syncMeta`.
 *
 * The columns exist so that rows can be created offline on one device and
 * reconciled later: `id` is a UUID the client can generate, `version` and
 * `updatedAt` drive last-write-wins conflict resolution, `updatedBy` records
 * which device wrote last, and `deletedAt` is a tombstone.
 *
 * **Never hard-delete.** Set `deletedAt` and filter it out on read.
 */
export const syncMeta = {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  /** Tombstone. Non-null means the row is deleted as far as the app cares. */
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  version: integer('version').notNull().default(1),
  /** Which device last wrote the row. There are no user accounts. */
  updatedBy: text('updated_by').notNull().default('local'),
};

/**
 * The one table the skeleton ships with: instance-local key/value settings.
 *
 * It exists to make the migration and query pipeline real and testable. Domain
 * tables (encounters, combatants, …) arrive with the initiative tracker.
 *
 * Note `sortOrder`, not `order` — `order` is a reserved word.
 */
export const appSettings = sqliteTable('app_settings', {
  ...syncMeta,
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;

/* ---------------------------------------------------------------------------
 * Library tables
 *
 * Imported from the Open5e fixtures (SRD 5.2, CC-BY-4.0) and never edited, so
 * they are the one documented exception to `syncMeta`: there is nothing to
 * reconcile, no soft delete, and no `updatedBy`. They are keyed by the
 * upstream slug (`srd-2024_aboleth`), which makes re-import an upsert.
 *
 * The mirror is faithful except for fields deliberately left out:
 *   - `experience_points_integer` and `proficiency_bonus` are null in 330 of
 *     331 records upstream; both are derived from CR instead (DECISIONS #17).
 *   - `illustration`, `unit`, `weight`, `subcategory`, `environments` and
 *     `normal_sight_range` are empty or not part of a statblock.
 * ------------------------------------------------------------------------- */

export const creatures = sqliteTable('creatures', {
  /** The upstream primary key, e.g. `srd-2024_aboleth`. */
  slug: text('slug').primaryKey(),
  document: text('document').notNull(),
  name: text('name').notNull(),
  size: text('size').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  alignment: text('alignment').notNull(),

  /** Stored as a number so CR ranges are queryable. 1/8 imports as 0.125. */
  challengeRating: real('challenge_rating').notNull(),

  armorClass: integer('armor_class').notNull(),
  armorDetail: text('armor_detail'),
  hitPoints: integer('hit_points').notNull(),
  hitDice: text('hit_dice').notNull(),

  /** Precomputed upstream, so adding a monster can roll initiative directly. */
  initiativeBonus: integer('initiative_bonus'),

  abilityScoreStrength: integer('ability_score_strength').notNull(),
  abilityScoreDexterity: integer('ability_score_dexterity').notNull(),
  abilityScoreConstitution: integer('ability_score_constitution'),
  abilityScoreIntelligence: integer('ability_score_intelligence').notNull(),
  abilityScoreWisdom: integer('ability_score_wisdom').notNull(),
  abilityScoreCharisma: integer('ability_score_charisma').notNull(),

  savingThrowStrength: integer('saving_throw_strength'),
  savingThrowDexterity: integer('saving_throw_dexterity'),
  savingThrowConstitution: integer('saving_throw_constitution'),
  savingThrowIntelligence: integer('saving_throw_intelligence'),
  savingThrowWisdom: integer('saving_throw_wisdom'),
  savingThrowCharisma: integer('saving_throw_charisma'),

  skillBonusAcrobatics: integer('skill_bonus_acrobatics'),
  skillBonusAnimalHandling: integer('skill_bonus_animal_handling'),
  skillBonusArcana: integer('skill_bonus_arcana'),
  skillBonusAthletics: integer('skill_bonus_athletics'),
  skillBonusDeception: integer('skill_bonus_deception'),
  skillBonusHistory: integer('skill_bonus_history'),
  skillBonusInsight: integer('skill_bonus_insight'),
  skillBonusIntimidation: integer('skill_bonus_intimidation'),
  skillBonusInvestigation: integer('skill_bonus_investigation'),
  skillBonusMedicine: integer('skill_bonus_medicine'),
  skillBonusNature: integer('skill_bonus_nature'),
  skillBonusPerception: integer('skill_bonus_perception'),
  skillBonusPerformance: integer('skill_bonus_performance'),
  skillBonusPersuasion: integer('skill_bonus_persuasion'),
  skillBonusReligion: integer('skill_bonus_religion'),
  skillBonusSleightOfHand: integer('skill_bonus_sleight_of_hand'),
  skillBonusStealth: integer('skill_bonus_stealth'),
  skillBonusSurvival: integer('skill_bonus_survival'),

  walk: integer('walk'),
  swim: integer('swim'),
  fly: integer('fly'),
  climb: integer('climb'),
  burrow: integer('burrow'),
  hover: integer('hover', { mode: 'boolean' }).notNull().default(false),

  darkvisionRange: integer('darkvision_range'),
  blindsightRange: integer('blindsight_range'),
  tremorsenseRange: integer('tremorsense_range'),
  truesightRange: integer('truesight_range'),
  telepathyRange: integer('telepathy_range'),
  passivePerception: integer('passive_perception').notNull(),

  /**
   * Kept as both the queryable slug array and the pre-rendered string upstream
   * supplies, so the statblock never has to re-derive prose from slugs.
   */
  damageImmunities: text('damage_immunities', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  damageImmunitiesDisplay: text('damage_immunities_display'),
  damageResistances: text('damage_resistances', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  damageResistancesDisplay: text('damage_resistances_display'),
  damageVulnerabilities: text('damage_vulnerabilities', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  damageVulnerabilitiesDisplay: text('damage_vulnerabilities_display'),
  conditionImmunities: text('condition_immunities', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  conditionImmunitiesDisplay: text('condition_immunities_display'),

  nonmagicalAttackImmunity: integer('nonmagical_attack_immunity', {
    mode: 'boolean',
  })
    .notNull()
    .default(false),
  nonmagicalAttackResistance: integer('nonmagical_attack_resistance', {
    mode: 'boolean',
  })
    .notNull()
    .default(false),

  languages: text('languages', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
  languagesDesc: text('languages_desc'),
});

/** ACTION | BONUS_ACTION | REACTION | LEGENDARY_ACTION, ordered for display. */
export const creatureActions = sqliteTable('creature_actions', {
  slug: text('slug').primaryKey(),
  creatureSlug: text('creature_slug')
    .notNull()
    .references(() => creatures.slug, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  desc: text('desc').notNull(),
  actionType: text('action_type').notNull(),
  /** Upstream's display order. Named sortOrder — `order` is reserved. */
  sortOrder: integer('sort_order').notNull().default(0),
  legendaryActionCost: integer('legendary_action_cost'),
  usesType: text('uses_type'),
  usesParam: integer('uses_param'),
});

/** Structured attack rolls hanging off an action. */
export const creatureActionAttacks = sqliteTable('creature_action_attacks', {
  slug: text('slug').primaryKey(),
  actionSlug: text('action_slug')
    .notNull()
    .references(() => creatureActions.slug, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  attackType: text('attack_type'),
  toHitMod: integer('to_hit_mod'),
  reach: integer('reach'),
  range: integer('range'),
  longRange: integer('long_range'),
  targetCreatureOnly: integer('target_creature_only', { mode: 'boolean' })
    .notNull()
    .default(false),
  damageDieCount: integer('damage_die_count'),
  damageDieType: text('damage_die_type'),
  damageBonus: integer('damage_bonus'),
  damageType: text('damage_type'),
  extraDamageDieCount: integer('extra_damage_die_count'),
  extraDamageDieType: text('extra_damage_die_type'),
  extraDamageBonus: integer('extra_damage_bonus'),
  extraDamageType: text('extra_damage_type'),
});

export const creatureTraits = sqliteTable('creature_traits', {
  slug: text('slug').primaryKey(),
  creatureSlug: text('creature_slug')
    .notNull()
    .references(() => creatures.slug, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  desc: text('desc').notNull(),
  type: text('type'),
});

/**
 * The fifteen 2024 conditions. Upstream has no display name — only the slug it
 * `describes` — so the name is derived on import.
 */
export const conditions = sqliteTable('conditions', {
  slug: text('slug').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  desc: text('desc').notNull(),
});

/**
 * Provenance. Because the library is fetched on demand rather than vendored
 * (DECISIONS #12), the database has to be able to answer "which upstream
 * revision is this, and when did it land?".
 */
export const importRuns = sqliteTable('import_runs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  gitRef: text('git_ref').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
  creatureCount: integer('creature_count').notNull().default(0),
  actionCount: integer('action_count').notNull().default(0),
  attackCount: integer('attack_count').notNull().default(0),
  traitCount: integer('trait_count').notNull().default(0),
  conditionCount: integer('condition_count').notNull().default(0),
  spellCount: integer('spell_count').notNull().default(0),
  castingOptionCount: integer('casting_option_count').notNull().default(0),
  error: text('error'),
});

/**
 * The SRD 5.2 spell list.
 *
 * Imported alongside the creatures because it is the same document, the same
 * licence and the same fetch: a DM who wants to know what Hold Person does
 * should not have to leave the toolbox. Like every other library table it is
 * keyed by the upstream slug and exempt from `syncMeta`.
 *
 * `material_cost` is null in every upstream record and is not mirrored.
 */
export const spells = sqliteTable('spells', {
  /** The upstream primary key, e.g. `srd-2024_acid-arrow`. */
  slug: text('slug').primaryKey(),
  document: text('document').notNull(),
  name: text('name').notNull(),
  desc: text('desc').notNull(),
  /** 0 for a cantrip. */
  level: integer('level').notNull(),
  school: text('school').notNull(),
  higherLevel: text('higher_level'),

  targetType: text('target_type'),
  /** The prose upstream renders ("90 feet"), kept beside the number. */
  rangeText: text('range_text'),
  range: real('range').notNull().default(0),
  rangeUnit: text('range_unit'),
  targetCount: integer('target_count').notNull().default(0),

  castingTime: text('casting_time').notNull(),
  /** Set only for a reaction: what triggers it. */
  reactionCondition: text('reaction_condition'),
  ritual: integer('ritual', { mode: 'boolean' }).notNull().default(false),
  concentration: integer('concentration', { mode: 'boolean' })
    .notNull()
    .default(false),
  duration: text('duration').notNull(),

  verbal: integer('verbal', { mode: 'boolean' }).notNull().default(false),
  somatic: integer('somatic', { mode: 'boolean' }).notNull().default(false),
  material: integer('material', { mode: 'boolean' }).notNull().default(false),
  materialSpecified: text('material_specified'),
  materialConsumed: integer('material_consumed', { mode: 'boolean' })
    .notNull()
    .default(false),

  /** Empty upstream when the spell allows no saving throw. */
  savingThrowAbility: text('saving_throw_ability'),
  attackRoll: integer('attack_roll', { mode: 'boolean' })
    .notNull()
    .default(false),
  damageRoll: text('damage_roll'),
  damageTypes: text('damage_types', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),

  shapeType: text('shape_type'),
  shapeSize: real('shape_size'),
  shapeSizeUnit: text('shape_size_unit'),

  /** Which classes get it, as upstream class slugs. */
  classes: text('classes', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default([]),
});

/**
 * What changes when a spell is cast with a higher slot — the structured form
 * of the "At Higher Levels" paragraph.
 *
 * Keyed by the stringified upstream integer pk, because this is one of the few
 * Open5e models without a slug.
 */
export const spellCastingOptions = sqliteTable('spell_casting_options', {
  id: text('id').primaryKey(),
  spellSlug: text('spell_slug')
    .notNull()
    .references(() => spells.slug, { onDelete: 'cascade' }),
  /** `slot_level_3`, `pact_slot`, … */
  type: text('type').notNull(),
  desc: text('desc'),
  damageRoll: text('damage_roll'),
  duration: text('duration'),
  /** Prose upstream, unlike the spell's numeric range. */
  range: text('range'),
  targetCount: integer('target_count'),
  shapeSize: real('shape_size'),
  concentration: integer('concentration', { mode: 'boolean' }),
});

export type Creature = typeof creatures.$inferSelect;
export type NewCreature = typeof creatures.$inferInsert;
export type CreatureAction = typeof creatureActions.$inferSelect;
export type NewCreatureAction = typeof creatureActions.$inferInsert;
export type CreatureActionAttack = typeof creatureActionAttacks.$inferSelect;
export type NewCreatureActionAttack = typeof creatureActionAttacks.$inferInsert;
export type CreatureTrait = typeof creatureTraits.$inferSelect;
export type NewCreatureTrait = typeof creatureTraits.$inferInsert;
export type Condition = typeof conditions.$inferSelect;
export type NewCondition = typeof conditions.$inferInsert;
export type Spell = typeof spells.$inferSelect;
export type NewSpell = typeof spells.$inferInsert;
export type SpellCastingOption = typeof spellCastingOptions.$inferSelect;
export type NewSpellCastingOption = typeof spellCastingOptions.$inferInsert;
export type ImportRun = typeof importRuns.$inferSelect;

/* ---------------------------------------------------------------------------
 * Session state
 *
 * Ours, not imported. Everything here spreads `syncMeta` and is soft-deleted.
 * ------------------------------------------------------------------------- */

/**
 * The party. Characters outlive any single fight — clearing an encounter
 * removes the monsters and leaves these in place (DECISIONS #14).
 *
 * `level` is not decoration: the encounter difficulty readout needs party
 * level as well as party size (DECISIONS #17).
 */
export const playerCharacters = sqliteTable('player_characters', {
  ...syncMeta,
  name: text('name').notNull(),
  /** Who is playing them, so the DM knows whose turn to call. */
  playerName: text('player_name'),
  armorClass: integer('armor_class').notNull(),
  maxHitPoints: integer('max_hit_points').notNull(),
  /** Added to a d20 when the DM types in what the player rolled. */
  initiativeModifier: integer('initiative_modifier').notNull().default(0),
  level: integer('level').notNull().default(1),
});

export type PlayerCharacter = typeof playerCharacters.$inferSelect;
export type NewPlayerCharacter = typeof playerCharacters.$inferInsert;

/**
 * The encounter. There is exactly one (DECISIONS #14), held as a single row
 * with a fixed id so there is never a "which encounter?" question to answer.
 */
export const CURRENT_ENCOUNTER_ID = 'current';

export const encounters = sqliteTable('encounters', {
  ...syncMeta,
  roundNumber: integer('round_number').notNull().default(0),
  /** Null before the fight starts and after it is cleared. */
  activeCombatantId: text('active_combatant_id'),
});

/**
 * A row in the initiative order.
 *
 * References the library rather than copying a statblock (DECISIONS #15): it
 * carries only what changes during a fight. Exactly one of `creatureSlug` and
 * `playerCharacterId` is set — the check constraint below enforces it, because
 * a combatant that is both or neither has no statblock to show.
 */
export const combatants = sqliteTable(
  'combatants',
  {
    ...syncMeta,
    encounterId: text('encounter_id')
      .notNull()
      .references(() => encounters.id, { onDelete: 'cascade' }),
    creatureSlug: text('creature_slug').references(() => creatures.slug),
    playerCharacterId: text('player_character_id').references(
      () => playerCharacters.id,
    ),

    /** "Goblin 3", or "Meat" for a renamed dragon. */
    displayName: text('display_name').notNull(),
    initiative: integer('initiative').notNull().default(0),
    currentHitPoints: integer('current_hit_points').notNull(),
    maxHitPoints: integer('max_hit_points').notNull(),
    temporaryHitPoints: integer('temporary_hit_points').notNull().default(0),
    armorClass: integer('armor_class').notNull(),

    /** Omitted from the player view entirely — an ambush must stay hidden. */
    isHidden: integer('is_hidden', { mode: 'boolean' })
      .notNull()
      .default(false),
    /** Stepped out of the order, waiting to re-enter. */
    isDelayed: integer('is_delayed', { mode: 'boolean' })
      .notNull()
      .default(false),
    /** Tie-break and manual drag order. Never `order` — reserved word. */
    sortOrder: integer('sort_order').notNull().default(0),
  },
  table => [
    check(
      'combatant_has_exactly_one_source',
      sql`(${table.creatureSlug} is not null) <> (${table.playerCharacterId} is not null)`,
    ),
  ],
);

export type Encounter = typeof encounters.$inferSelect;
export type Combatant = typeof combatants.$inferSelect;
export type NewCombatant = typeof combatants.$inferInsert;

/**
 * A condition applied to a combatant, optionally with a countdown.
 *
 * `roundsRemaining` is null for an indefinite condition — Prone stays until
 * someone stands up, and guessing a duration for it would be worse than
 * tracking none. A number counts down as rounds pass and expires at zero.
 */
export const combatantConditions = sqliteTable('combatant_conditions', {
  ...syncMeta,
  combatantId: text('combatant_id')
    .notNull()
    .references(() => combatants.id, { onDelete: 'cascade' }),
  conditionSlug: text('condition_slug')
    .notNull()
    .references(() => conditions.slug),
  roundsRemaining: integer('rounds_remaining'),
  /** Free text: "concentrating on Hold Person", "grappled by the dragon". */
  note: text('note'),
});

export type CombatantCondition = typeof combatantConditions.$inferSelect;
export type NewCombatantCondition = typeof combatantConditions.$inferInsert;

/**
 * A saved encounter: a named set of monsters, with how many of each.
 *
 * Deliberately not a snapshot of the fight. Hit points, initiative, conditions
 * and the round counter are all state of one evening; what is worth keeping is
 * "the ambush at the bridge is three goblins and a hobgoblin". Player
 * characters are excluded for the same reason `clearNonPlayerCombatants`
 * exists — the party is a roster, not part of an encounter (DECISIONS #14).
 */
export const encounterPresets = sqliteTable('encounter_presets', {
  ...syncMeta,
  name: text('name').notNull(),
  note: text('note'),
});

/**
 * One creature line of a saved encounter.
 *
 * A count rather than one row per monster, because that is how a preset is
 * read and edited — "4 goblins", not four goblins. The individual rows are
 * created when the preset is applied.
 */
export const encounterPresetEntries = sqliteTable('encounter_preset_entries', {
  ...syncMeta,
  presetId: text('preset_id')
    .notNull()
    .references(() => encounterPresets.id, { onDelete: 'cascade' }),
  creatureSlug: text('creature_slug')
    .notNull()
    .references(() => creatures.slug),
  count: integer('count').notNull().default(1),
  /** Display order within the preset. Never `order` — reserved word. */
  sortOrder: integer('sort_order').notNull().default(0),
});

export type EncounterPreset = typeof encounterPresets.$inferSelect;
export type NewEncounterPreset = typeof encounterPresets.$inferInsert;
export type EncounterPresetEntry = typeof encounterPresetEntries.$inferSelect;
export type NewEncounterPresetEntry =
  typeof encounterPresetEntries.$inferInsert;

/* ---------------------------------------------------------------------------
 * Maps
 *
 * Ours, not imported — everything here spreads `syncMeta` and is soft-deleted,
 * same as every other session-state table above.
 * ------------------------------------------------------------------------- */

/** A single fog-of-war brush stroke, replayed in order to rebuild the mask. */
export type MapFogStroke = {
  id: string;
  x: number;
  y: number;
  radius: number;
  /** 0 = hard edge, 1 = fully feathered. */
  softness: number;
  shape: 'circle' | 'square';
  mode: 'reveal' | 'cover';
};

export type MapFogState = {
  enabled: boolean;
  /** What the strokes are layered on top of — "reveal all"/"reset" are a
   * one-field flip plus `strokes: []`, not a synthesized full-canvas stroke. */
  baseState: 'covered' | 'revealed';
  /** DM's own overlay darkness. Never crosses to the player view. */
  opacityDm: number;
  /** What the player screen actually renders at. */
  opacityTable: number;
  strokes: MapFogStroke[];
};

export const DEFAULT_MAP_FOG_STATE: MapFogState = {
  enabled: false,
  baseState: 'covered',
  opacityDm: 0.6,
  opacityTable: 0.9,
  strokes: [],
};

/**
 * A folder in the map gallery. One level deep — nothing here ever needs a
 * `parentId`; the source app's own folder tree never went deeper either.
 *
 * A real table rather than a string column on `maps`, because a folder is no
 * longer a filesystem path here: renaming it is a single `UPDATE`, not a
 * cascading rewrite of every contained map's storage path.
 */
export const mapFolders = sqliteTable('map_folders', {
  ...syncMeta,
  name: text('name').notNull(),
  /** Never `order` — reserved word. */
  sortOrder: integer('sort_order').notNull().default(0),
});

export type MapFolder = typeof mapFolders.$inferSelect;
export type NewMapFolder = typeof mapFolders.$inferInsert;

/**
 * An uploaded battle map (image or looping video).
 *
 * `storagePath` is always server-generated (a random id plus extension, see
 * `src/utils/mapStorage`) and never derived from the original filename, so
 * there is no user-controlled filesystem path anywhere in this table.
 *
 * Grid calibration lives here, per map, rather than in a separate metadata
 * file: `gridCellSize` is null until the two-click calibration flow commits
 * it. Fog is also per-map, not global — switching the active map must not
 * require deciding what happens to fog progress on the previous one.
 */
export const maps = sqliteTable(
  'maps',
  {
    ...syncMeta,
    folderId: text('folder_id').references(() => mapFolders.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    /** 'image' | 'video' */
    kind: text('kind').notNull(),
    storagePath: text('storage_path').notNull().unique(),
    originalFilename: text('original_filename').notNull(),
    mimeType: text('mime_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    /** Null until the client reports them after first decode. */
    nativeWidth: integer('native_width'),
    nativeHeight: integer('native_height'),
    /** Null means "uncalibrated". */
    gridCellSize: real('grid_cell_size'),
    gridOriginX: real('grid_origin_x').notNull().default(0),
    gridOriginY: real('grid_origin_y').notNull().default(0),
    fog: text('fog', { mode: 'json' })
      .$type<MapFogState>()
      .notNull()
      .default(DEFAULT_MAP_FOG_STATE),
  },
  table => [
    check('maps_kind_is_valid', sql`${table.kind} in ('image', 'video')`),
  ],
);

export type MapAsset = typeof maps.$inferSelect;
export type NewMapAsset = typeof maps.$inferInsert;

/**
 * The live map session. There is exactly one, mirroring `encounters`: a
 * single row with a fixed id, so there is never a "which session?" question.
 *
 * The DM's own viewport is persisted so it survives a restart, but it is
 * never sent to the player — only `playerViewport*` (the "lens" the DM drags
 * and zooms to control exactly what the second screen shows) crosses that
 * boundary, in `toPlayerMapView`.
 */
export const CURRENT_MAP_SESSION_ID = 'current';

export type PlayerScreenMode = 'map' | 'tracker' | 'both';
export type PlayerScreenOrientation = 'auto' | 'landscape' | 'portrait';

export const mapSessions = sqliteTable(
  'map_sessions',
  {
    ...syncMeta,
    activeMapId: text('active_map_id').references(() => maps.id, {
      onDelete: 'set null',
    }),

    dmViewportX: real('dm_viewport_x').notNull().default(0),
    dmViewportY: real('dm_viewport_y').notNull().default(0),
    dmViewportZoom: real('dm_viewport_zoom').notNull().default(1),

    playerViewportX: real('player_viewport_x').notNull().default(0),
    playerViewportY: real('player_viewport_y').notNull().default(0),
    playerViewportZoom: real('player_viewport_zoom').notNull().default(1),
    playerViewportRotation: real('player_viewport_rotation'),

    /** Reported by the player screen itself, so the DM's lens rectangle
     * sizes correctly against its actual aspect ratio. */
    playerScreenWidth: integer('player_screen_width').notNull().default(1920),
    playerScreenHeight: integer('player_screen_height').notNull().default(1080),

    isViewportLocked: integer('is_viewport_locked', { mode: 'boolean' })
      .notNull()
      .default(false),

    gridVisible: integer('grid_visible', { mode: 'boolean' })
      .notNull()
      .default(true),
    gridColor: text('grid_color').notNull().default('#e0e5f5'),
    gridOpacity: real('grid_opacity').notNull().default(0.18),
    gridBackgroundColor: text('grid_background_color')
      .notNull()
      .default('#0c0d11'),

    /** What the second screen currently shows. The extension point for a
     * future richer per-widget layout — this milestone ships only the
     * three-way toggle. Defaults to the tracker so a session that predates
     * Maps doesn't have its player screen silently switch away from it. */
    playerScreenMode: text('player_screen_mode')
      .$type<PlayerScreenMode>()
      .notNull()
      .default('tracker'),

    /** Page-level, independent of `playerViewportRotation` (which is an
     * unused per-viewport field): whether the player screen's whole content
     * is rotated 90° to match a physically landscape/portrait TV. `auto`
     * follows whatever the player screen itself reports. */
    playerScreenOrientation: text('player_screen_orientation')
      .$type<PlayerScreenOrientation>()
      .notNull()
      .default('auto'),

    /** The tracker overlay in 'both' mode. Anchor is a 0..1 fraction of the
     * player's own visible area (not raw pixels), so it stays proportionally
     * placed across screen sizes. `showConditions` has no effect yet —
     * conditions don't reach the player payload until a later milestone. */
    trackerOverlayAnchorX: real('tracker_overlay_anchor_x')
      .notNull()
      .default(0.98),
    trackerOverlayAnchorY: real('tracker_overlay_anchor_y')
      .notNull()
      .default(0.98),
    trackerOverlayScale: real('tracker_overlay_scale').notNull().default(1),
    trackerOverlayOpacity: real('tracker_overlay_opacity')
      .notNull()
      .default(0.9),
    trackerOverlayShowInitiative: integer('tracker_overlay_show_initiative', {
      mode: 'boolean',
    })
      .notNull()
      .default(true),
    trackerOverlayShowName: integer('tracker_overlay_show_name', {
      mode: 'boolean',
    })
      .notNull()
      .default(true),
    trackerOverlayShowHealth: integer('tracker_overlay_show_health', {
      mode: 'boolean',
    })
      .notNull()
      .default(true),
    trackerOverlayShowConditions: integer('tracker_overlay_show_conditions', {
      mode: 'boolean',
    })
      .notNull()
      .default(false),
  },
  table => [
    check(
      'map_sessions_mode_is_valid',
      sql`${table.playerScreenMode} in ('map', 'tracker', 'both')`,
    ),
    check(
      'map_sessions_orientation_is_valid',
      sql`${table.playerScreenOrientation} in ('auto', 'landscape', 'portrait')`,
    ),
  ],
);

export type MapSession = typeof mapSessions.$inferSelect;
