import { z } from 'zod';
import { idInputSchema } from '~/server/trpc/schemas/common';
import { experienceByChallengeRating } from '~/content/challengeRating';

/**
 * The same CR values Open5e uses, not a free numeric field — so XP and
 * proficiency-bonus lookups (`~/utils/formatChallengeRating`) always
 * resolve.
 */
const CHALLENGE_RATINGS = Object.keys(experienceByChallengeRating).map(Number);

const challengeRatingSchema = z
  .number()
  .refine(value => CHALLENGE_RATINGS.includes(value), {
    message: 'Not a valid challenge rating.',
  });

const abilityScoreSchema = z.number().int().min(1).max(30);
const modifierSchema = z.number().int().min(-10).max(20).optional();
const speedSchema = z.number().int().min(0).max(200).optional();
const senseRangeSchema = z.number().int().min(0).max(200).optional();

export const CUSTOM_CREATURE_ACTION_TYPES = [
  'ACTION',
  'BONUS_ACTION',
  'REACTION',
  'LEGENDARY_ACTION',
] as const;

const attackSchema = z.object({
  name: z.string().trim().min(1).max(80),
  attackType: z.string().trim().max(40).optional(),
  toHitMod: modifierSchema,
  reach: z.number().int().min(0).max(60).optional(),
  range: z.number().int().min(0).max(1000).optional(),
  longRange: z.number().int().min(0).max(1000).optional(),
  targetCreatureOnly: z.boolean().default(false),
  damageDieCount: z.number().int().min(0).max(20).optional(),
  damageDieType: z.string().trim().max(10).optional(),
  damageBonus: modifierSchema,
  damageType: z.string().trim().max(40).optional(),
  extraDamageDieCount: z.number().int().min(0).max(20).optional(),
  extraDamageDieType: z.string().trim().max(10).optional(),
  extraDamageBonus: modifierSchema,
  extraDamageType: z.string().trim().max(40).optional(),
});

const actionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  desc: z.string().trim().min(1).max(4000),
  actionType: z.enum(CUSTOM_CREATURE_ACTION_TYPES),
  legendaryActionCost: z.number().int().min(1).max(5).optional(),
  attack: attackSchema.optional(),
});

const traitSchema = z.object({
  name: z.string().trim().min(1).max(80),
  desc: z.string().trim().min(1).max(4000),
  type: z.string().trim().max(40).optional(),
});

/**
 * The curated field set a statblock card actually renders (issue #3) —
 * spellcasting, lair actions and regional effects are out of scope.
 */
const customCreatureFieldsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  size: z.string().trim().min(1).max(40),
  type: z.string().trim().min(1).max(40),
  alignment: z.string().trim().min(1).max(60),
  challengeRating: challengeRatingSchema,

  armorClass: z.number().int().min(0).max(30),
  armorDetail: z.string().trim().max(120).optional(),
  hitPoints: z.number().int().min(1).max(999),
  hitDice: z.string().trim().min(1).max(20),
  initiativeBonus: modifierSchema,

  abilityScoreStrength: abilityScoreSchema,
  abilityScoreDexterity: abilityScoreSchema,
  abilityScoreConstitution: abilityScoreSchema,
  abilityScoreIntelligence: abilityScoreSchema,
  abilityScoreWisdom: abilityScoreSchema,
  abilityScoreCharisma: abilityScoreSchema,

  savingThrowStrength: modifierSchema,
  savingThrowDexterity: modifierSchema,
  savingThrowConstitution: modifierSchema,
  savingThrowIntelligence: modifierSchema,
  savingThrowWisdom: modifierSchema,
  savingThrowCharisma: modifierSchema,

  skillBonusAcrobatics: modifierSchema,
  skillBonusAnimalHandling: modifierSchema,
  skillBonusArcana: modifierSchema,
  skillBonusAthletics: modifierSchema,
  skillBonusDeception: modifierSchema,
  skillBonusHistory: modifierSchema,
  skillBonusInsight: modifierSchema,
  skillBonusIntimidation: modifierSchema,
  skillBonusInvestigation: modifierSchema,
  skillBonusMedicine: modifierSchema,
  skillBonusNature: modifierSchema,
  skillBonusPerception: modifierSchema,
  skillBonusPerformance: modifierSchema,
  skillBonusPersuasion: modifierSchema,
  skillBonusReligion: modifierSchema,
  skillBonusSleightOfHand: modifierSchema,
  skillBonusStealth: modifierSchema,
  skillBonusSurvival: modifierSchema,

  walk: speedSchema,
  swim: speedSchema,
  fly: speedSchema,
  climb: speedSchema,
  burrow: speedSchema,
  hover: z.boolean().default(false),

  darkvisionRange: senseRangeSchema,
  blindsightRange: senseRangeSchema,
  tremorsenseRange: senseRangeSchema,
  truesightRange: senseRangeSchema,
  telepathyRange: senseRangeSchema,
  passivePerception: z.number().int().min(0).max(40),

  damageImmunitiesDisplay: z.string().trim().max(400).optional(),
  damageResistancesDisplay: z.string().trim().max(400).optional(),
  damageVulnerabilitiesDisplay: z.string().trim().max(400).optional(),
  conditionImmunitiesDisplay: z.string().trim().max(400).optional(),
  languagesDesc: z.string().trim().max(400).optional(),

  traits: z.array(traitSchema).default([]),
  actions: z.array(actionSchema).default([]),
});

export const createCustomCreatureInputSchema = customCreatureFieldsSchema;

export const updateCustomCreatureInputSchema =
  customCreatureFieldsSchema.extend({
    id: z.uuid(),
  });

export const customCreatureIdInputSchema = idInputSchema;

export type CreateCustomCreatureInput = z.infer<
  typeof createCustomCreatureInputSchema
>;
export type UpdateCustomCreatureInput = z.infer<
  typeof updateCustomCreatureInputSchema
>;
export type CustomCreatureActionInput = z.infer<typeof actionSchema>;
export type CustomCreatureAttackInput = z.infer<typeof attackSchema>;
export type CustomCreatureTraitInput = z.infer<typeof traitSchema>;
