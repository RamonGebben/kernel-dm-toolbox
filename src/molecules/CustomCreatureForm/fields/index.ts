/**
 * Field metadata shared by `AbilityScoreFields` and `SkillFields`: the form's
 * short draft key, the API field name it flattens to
 * (`~/server/trpc/schemas/customCreatures`), and the printed label. Kept
 * local to this form rather than reused from `buildStatblock`'s own internal
 * `ABILITIES`/`SKILL_FIELDS` consts — those are statblock-rendering config,
 * not exported, and this is a distinct (UI draft → API input) concern.
 */
export const ABILITY_FIELDS = [
  ['Strength', 'abilityScoreStrength', 'savingThrowStrength', 'STR'],
  ['Dexterity', 'abilityScoreDexterity', 'savingThrowDexterity', 'DEX'],
  [
    'Constitution',
    'abilityScoreConstitution',
    'savingThrowConstitution',
    'CON',
  ],
  [
    'Intelligence',
    'abilityScoreIntelligence',
    'savingThrowIntelligence',
    'INT',
  ],
  ['Wisdom', 'abilityScoreWisdom', 'savingThrowWisdom', 'WIS'],
  ['Charisma', 'abilityScoreCharisma', 'savingThrowCharisma', 'CHA'],
] as const;

export type AbilityKey = (typeof ABILITY_FIELDS)[number][0];

export const SKILL_FIELDS = [
  ['Acrobatics', 'skillBonusAcrobatics', 'Acrobatics'],
  ['AnimalHandling', 'skillBonusAnimalHandling', 'Animal Handling'],
  ['Arcana', 'skillBonusArcana', 'Arcana'],
  ['Athletics', 'skillBonusAthletics', 'Athletics'],
  ['Deception', 'skillBonusDeception', 'Deception'],
  ['History', 'skillBonusHistory', 'History'],
  ['Insight', 'skillBonusInsight', 'Insight'],
  ['Intimidation', 'skillBonusIntimidation', 'Intimidation'],
  ['Investigation', 'skillBonusInvestigation', 'Investigation'],
  ['Medicine', 'skillBonusMedicine', 'Medicine'],
  ['Nature', 'skillBonusNature', 'Nature'],
  ['Perception', 'skillBonusPerception', 'Perception'],
  ['Performance', 'skillBonusPerformance', 'Performance'],
  ['Persuasion', 'skillBonusPersuasion', 'Persuasion'],
  ['Religion', 'skillBonusReligion', 'Religion'],
  ['SleightOfHand', 'skillBonusSleightOfHand', 'Sleight of Hand'],
  ['Stealth', 'skillBonusStealth', 'Stealth'],
  ['Survival', 'skillBonusSurvival', 'Survival'],
] as const;

export type SkillKey = (typeof SKILL_FIELDS)[number][0];
