import type { NewCustomCreature } from '~/server/db/schema';
import type { CreateCustomCreatureInput } from '~/server/trpc/schemas/customCreatures';

type CustomCreatureFields = Omit<
  CreateCustomCreatureInput,
  'traits' | 'actions'
>;

type CustomCreatureColumns = Omit<
  NewCustomCreature,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'version' | 'updatedBy'
>;

/**
 * Maps the form/mutation input onto `custom_creatures` columns. Pure, so it
 * is testable without a database — the resolver only adds `?? null` at the
 * boundary between zod's `optional()` (`undefined`) and the column's
 * `null`.
 */
export const toCustomCreatureRow = (
  input: CustomCreatureFields,
): CustomCreatureColumns => ({
  name: input.name,
  size: input.size,
  type: input.type,
  alignment: input.alignment,
  challengeRating: input.challengeRating,

  armorClass: input.armorClass,
  armorDetail: input.armorDetail ?? null,
  hitPoints: input.hitPoints,
  hitDice: input.hitDice,
  initiativeBonus: input.initiativeBonus ?? null,

  abilityScoreStrength: input.abilityScoreStrength,
  abilityScoreDexterity: input.abilityScoreDexterity,
  abilityScoreConstitution: input.abilityScoreConstitution,
  abilityScoreIntelligence: input.abilityScoreIntelligence,
  abilityScoreWisdom: input.abilityScoreWisdom,
  abilityScoreCharisma: input.abilityScoreCharisma,

  savingThrowStrength: input.savingThrowStrength ?? null,
  savingThrowDexterity: input.savingThrowDexterity ?? null,
  savingThrowConstitution: input.savingThrowConstitution ?? null,
  savingThrowIntelligence: input.savingThrowIntelligence ?? null,
  savingThrowWisdom: input.savingThrowWisdom ?? null,
  savingThrowCharisma: input.savingThrowCharisma ?? null,

  skillBonusAcrobatics: input.skillBonusAcrobatics ?? null,
  skillBonusAnimalHandling: input.skillBonusAnimalHandling ?? null,
  skillBonusArcana: input.skillBonusArcana ?? null,
  skillBonusAthletics: input.skillBonusAthletics ?? null,
  skillBonusDeception: input.skillBonusDeception ?? null,
  skillBonusHistory: input.skillBonusHistory ?? null,
  skillBonusInsight: input.skillBonusInsight ?? null,
  skillBonusIntimidation: input.skillBonusIntimidation ?? null,
  skillBonusInvestigation: input.skillBonusInvestigation ?? null,
  skillBonusMedicine: input.skillBonusMedicine ?? null,
  skillBonusNature: input.skillBonusNature ?? null,
  skillBonusPerception: input.skillBonusPerception ?? null,
  skillBonusPerformance: input.skillBonusPerformance ?? null,
  skillBonusPersuasion: input.skillBonusPersuasion ?? null,
  skillBonusReligion: input.skillBonusReligion ?? null,
  skillBonusSleightOfHand: input.skillBonusSleightOfHand ?? null,
  skillBonusStealth: input.skillBonusStealth ?? null,
  skillBonusSurvival: input.skillBonusSurvival ?? null,

  walk: input.walk ?? null,
  swim: input.swim ?? null,
  fly: input.fly ?? null,
  climb: input.climb ?? null,
  burrow: input.burrow ?? null,
  hover: input.hover,

  darkvisionRange: input.darkvisionRange ?? null,
  blindsightRange: input.blindsightRange ?? null,
  tremorsenseRange: input.tremorsenseRange ?? null,
  truesightRange: input.truesightRange ?? null,
  telepathyRange: input.telepathyRange ?? null,
  passivePerception: input.passivePerception,

  damageImmunitiesDisplay: input.damageImmunitiesDisplay ?? null,
  damageResistancesDisplay: input.damageResistancesDisplay ?? null,
  damageVulnerabilitiesDisplay: input.damageVulnerabilitiesDisplay ?? null,
  conditionImmunitiesDisplay: input.conditionImmunitiesDisplay ?? null,
  languagesDesc: input.languagesDesc ?? null,
});
