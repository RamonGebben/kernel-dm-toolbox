import { z } from 'zod';

/**
 * The shape of Open5e's Django fixture files.
 *
 * This data arrives over the network from a repository we do not control, so
 * it is parsed rather than cast. A field that changes shape upstream becomes a
 * loud validation error naming the record, instead of a null that surfaces
 * three screens later as an empty statblock.
 *
 * Fields the schema deliberately ignores are documented in `schema.ts`.
 */

/** Every fixture record is `{ model, pk, fields }`. */
const fixtureRecord = <TFields extends z.ZodTypeAny>(fields: TFields) =>
  z.object({
    model: z.string(),
    pk: z.string(),
    fields,
  });

/**
 * The same shape, for the handful of models Open5e keys by an auto-increment
 * integer rather than a slug. Coerced to a string here so every library table
 * in this app has a text primary key and there is one rule, not two.
 */
const numericPkFixtureRecord = <TFields extends z.ZodTypeAny>(
  fields: TFields,
) =>
  z.object({
    model: z.string(),
    pk: z.number().int().transform(String),
    fields,
  });

const nullableInt = z.number().int().nullable().default(null);
const slugList = z.array(z.string()).default([]);

export const creatureFixtureSchema = fixtureRecord(
  z.object({
    name: z.string(),
    document: z.string(),
    size: z.string(),
    type: z.string(),
    category: z.string(),
    alignment: z.string(),
    /** A decimal string upstream: "10.000", "0.125". */
    challenge_rating: z.string(),

    armor_class: z.number().int(),
    armor_detail: z.string().nullable().default(null),
    hit_points: z.number().int(),
    hit_dice: z.string(),
    initiative_bonus: nullableInt,

    ability_score_strength: z.number().int(),
    ability_score_dexterity: z.number().int(),
    ability_score_constitution: nullableInt,
    ability_score_intelligence: z.number().int(),
    ability_score_wisdom: z.number().int(),
    ability_score_charisma: z.number().int(),

    saving_throw_strength: nullableInt,
    saving_throw_dexterity: nullableInt,
    saving_throw_constitution: nullableInt,
    saving_throw_intelligence: nullableInt,
    saving_throw_wisdom: nullableInt,
    saving_throw_charisma: nullableInt,

    skill_bonus_acrobatics: nullableInt,
    skill_bonus_animal_handling: nullableInt,
    skill_bonus_arcana: nullableInt,
    skill_bonus_athletics: nullableInt,
    skill_bonus_deception: nullableInt,
    skill_bonus_history: nullableInt,
    skill_bonus_insight: nullableInt,
    skill_bonus_intimidation: nullableInt,
    skill_bonus_investigation: nullableInt,
    skill_bonus_medicine: nullableInt,
    skill_bonus_nature: nullableInt,
    skill_bonus_perception: nullableInt,
    skill_bonus_performance: nullableInt,
    skill_bonus_persuasion: nullableInt,
    skill_bonus_religion: nullableInt,
    skill_bonus_sleight_of_hand: nullableInt,
    skill_bonus_stealth: nullableInt,
    skill_bonus_survival: nullableInt,

    walk: nullableInt,
    swim: nullableInt,
    fly: nullableInt,
    climb: nullableInt,
    burrow: nullableInt,
    hover: z.boolean().default(false),

    darkvision_range: nullableInt,
    blindsight_range: nullableInt,
    tremorsense_range: nullableInt,
    truesight_range: nullableInt,
    telepathy_range: nullableInt,
    passive_perception: z.number().int(),

    damage_immunities: slugList,
    damage_immunities_display: z.string().nullable().default(null),
    damage_resistances: slugList,
    damage_resistances_display: z.string().nullable().default(null),
    damage_vulnerabilities: slugList,
    damage_vulnerabilities_display: z.string().nullable().default(null),
    condition_immunities: slugList,
    condition_immunities_display: z.string().nullable().default(null),

    nonmagical_attack_immunity: z.boolean().default(false),
    nonmagical_attack_resistance: z.boolean().default(false),

    languages: slugList,
    languages_desc: z.string().nullable().default(null),
  }),
);

export const creatureActionFixtureSchema = fixtureRecord(
  z.object({
    name: z.string(),
    desc: z.string(),
    /** `parent` is the creature's pk. */
    parent: z.string(),
    action_type: z.string(),
    order_in_statblock: z.number().int().default(0),
    legendary_action_cost: nullableInt,
    uses_type: z.string().nullable().default(null),
    uses_param: nullableInt,
  }),
);

export const creatureActionAttackFixtureSchema = fixtureRecord(
  z.object({
    name: z.string(),
    /** `parent` is the action's pk. */
    parent: z.string(),
    attack_type: z.string().nullable().default(null),
    to_hit_mod: nullableInt,
    reach: nullableInt,
    range: nullableInt,
    long_range: nullableInt,
    target_creature_only: z.boolean().default(false),
    damage_die_count: nullableInt,
    damage_die_type: z.string().nullable().default(null),
    damage_bonus: nullableInt,
    damage_type: z.string().nullable().default(null),
    extra_damage_die_count: nullableInt,
    extra_damage_die_type: z.string().nullable().default(null),
    extra_damage_bonus: nullableInt,
    extra_damage_type: z.string().nullable().default(null),
  }),
);

export const creatureTraitFixtureSchema = fixtureRecord(
  z.object({
    name: z.string(),
    desc: z.string(),
    parent: z.string(),
    type: z.string().nullable().default(null),
  }),
);

export const conditionFixtureSchema = fixtureRecord(
  z.object({
    /** There is no `name` upstream — only the slug this describes. */
    describes: z.string(),
    desc: z.string(),
    document: z.string(),
  }),
);

/**
 * A spell.
 *
 * `material_cost` is null in every record upstream and is left out, the same
 * way `proficiency_bonus` is on creatures.
 */
export const spellFixtureSchema = fixtureRecord(
  z.object({
    name: z.string(),
    desc: z.string(),
    document: z.string(),
    level: z.number().int(),
    school: z.string(),
    higher_level: z.string().default(''),
    target_type: z.string().default(''),
    range_text: z.string().default(''),
    range: z.number(),
    range_unit: z.string().nullable().default(null),
    ritual: z.boolean().default(false),
    casting_time: z.string(),
    reaction_condition: z.string().nullable().default(null),
    verbal: z.boolean().default(false),
    somatic: z.boolean().default(false),
    material: z.boolean().default(false),
    material_specified: z.string().default(''),
    material_consumed: z.boolean().default(false),
    target_count: z.number().int().default(0),
    /** Empty string upstream when the spell allows no save. */
    saving_throw_ability: z.string().default(''),
    attack_roll: z.boolean().default(false),
    damage_roll: z.string().default(''),
    damage_types: slugList,
    duration: z.string(),
    shape_type: z.string().nullable().default(null),
    shape_size: z.number().nullable().default(null),
    shape_size_unit: z.string().nullable().default(null),
    concentration: z.boolean().default(false),
    classes: slugList,
  }),
);

/**
 * What changes when a spell is cast with a higher slot, or by a higher-level
 * caster. `type` is the upstream discriminator (`slot_level_3`, `pact_slot`).
 *
 * Note `range` is a string here, unlike the numeric `range` on the spell —
 * upstream models the upgrade as prose.
 */
export const spellCastingOptionFixtureSchema = numericPkFixtureRecord(
  z.object({
    /** `parent` is the spell's pk. */
    parent: z.string(),
    type: z.string(),
    desc: z.string().nullable().default(null),
    damage_roll: z.string().nullable().default(null),
    duration: z.string().nullable().default(null),
    range: z.string().nullable().default(null),
    target_count: nullableInt,
    shape_size: z.number().nullable().default(null),
    concentration: z.boolean().nullable().default(null),
  }),
);

export type CreatureFixture = z.infer<typeof creatureFixtureSchema>;
export type CreatureActionFixture = z.infer<typeof creatureActionFixtureSchema>;
export type CreatureActionAttackFixture = z.infer<
  typeof creatureActionAttackFixtureSchema
>;
export type CreatureTraitFixture = z.infer<typeof creatureTraitFixtureSchema>;
export type ConditionFixture = z.infer<typeof conditionFixtureSchema>;
export type SpellFixture = z.infer<typeof spellFixtureSchema>;
export type SpellCastingOptionFixture = z.infer<
  typeof spellCastingOptionFixtureSchema
>;

/** The files we pull, and the schema each is parsed with. */
export const fixtureFiles = {
  Creature: creatureFixtureSchema,
  CreatureAction: creatureActionFixtureSchema,
  CreatureActionAttack: creatureActionAttackFixtureSchema,
  CreatureTrait: creatureTraitFixtureSchema,
  ConditionDescription: conditionFixtureSchema,
  Spell: spellFixtureSchema,
  SpellCastingOption: spellCastingOptionFixtureSchema,
} as const;

export type FixtureFileName = keyof typeof fixtureFiles;
