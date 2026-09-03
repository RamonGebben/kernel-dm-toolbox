import type { CreatureFixture } from '~/server/library/fixtures';
import type { NewCreature } from '~/server/db/schema';
import { parseChallengeRating } from '~/utils/formatChallengeRating';

/**
 * Maps one Open5e creature fixture onto a database row.
 *
 * Pure: no database, no network, no clock. The whole import pipeline is built
 * this way so its correctness is testable from the node project.
 */
export const toCreatureRow = (fixture: CreatureFixture): NewCreature => {
  const { pk, fields } = fixture;

  return {
    slug: pk,
    document: fields.document,
    name: fields.name,
    size: fields.size,
    type: fields.type,
    category: fields.category,
    alignment: fields.alignment,
    challengeRating: parseChallengeRating(fields.challenge_rating),

    armorClass: fields.armor_class,
    armorDetail: fields.armor_detail,
    hitPoints: fields.hit_points,
    hitDice: fields.hit_dice,
    initiativeBonus: fields.initiative_bonus,

    abilityScoreStrength: fields.ability_score_strength,
    abilityScoreDexterity: fields.ability_score_dexterity,
    abilityScoreConstitution: fields.ability_score_constitution,
    abilityScoreIntelligence: fields.ability_score_intelligence,
    abilityScoreWisdom: fields.ability_score_wisdom,
    abilityScoreCharisma: fields.ability_score_charisma,

    savingThrowStrength: fields.saving_throw_strength,
    savingThrowDexterity: fields.saving_throw_dexterity,
    savingThrowConstitution: fields.saving_throw_constitution,
    savingThrowIntelligence: fields.saving_throw_intelligence,
    savingThrowWisdom: fields.saving_throw_wisdom,
    savingThrowCharisma: fields.saving_throw_charisma,

    skillBonusAcrobatics: fields.skill_bonus_acrobatics,
    skillBonusAnimalHandling: fields.skill_bonus_animal_handling,
    skillBonusArcana: fields.skill_bonus_arcana,
    skillBonusAthletics: fields.skill_bonus_athletics,
    skillBonusDeception: fields.skill_bonus_deception,
    skillBonusHistory: fields.skill_bonus_history,
    skillBonusInsight: fields.skill_bonus_insight,
    skillBonusIntimidation: fields.skill_bonus_intimidation,
    skillBonusInvestigation: fields.skill_bonus_investigation,
    skillBonusMedicine: fields.skill_bonus_medicine,
    skillBonusNature: fields.skill_bonus_nature,
    skillBonusPerception: fields.skill_bonus_perception,
    skillBonusPerformance: fields.skill_bonus_performance,
    skillBonusPersuasion: fields.skill_bonus_persuasion,
    skillBonusReligion: fields.skill_bonus_religion,
    skillBonusSleightOfHand: fields.skill_bonus_sleight_of_hand,
    skillBonusStealth: fields.skill_bonus_stealth,
    skillBonusSurvival: fields.skill_bonus_survival,

    walk: fields.walk,
    swim: fields.swim,
    fly: fields.fly,
    climb: fields.climb,
    burrow: fields.burrow,
    hover: fields.hover,

    darkvisionRange: fields.darkvision_range,
    blindsightRange: fields.blindsight_range,
    tremorsenseRange: fields.tremorsense_range,
    truesightRange: fields.truesight_range,
    telepathyRange: fields.telepathy_range,
    passivePerception: fields.passive_perception,

    damageImmunities: fields.damage_immunities,
    damageImmunitiesDisplay: fields.damage_immunities_display,
    damageResistances: fields.damage_resistances,
    damageResistancesDisplay: fields.damage_resistances_display,
    damageVulnerabilities: fields.damage_vulnerabilities,
    damageVulnerabilitiesDisplay: fields.damage_vulnerabilities_display,
    conditionImmunities: fields.condition_immunities,
    conditionImmunitiesDisplay: fields.condition_immunities_display,

    nonmagicalAttackImmunity: fields.nonmagical_attack_immunity,
    nonmagicalAttackResistance: fields.nonmagical_attack_resistance,

    languages: fields.languages,
    languagesDesc: fields.languages_desc,
  };
};
