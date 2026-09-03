import type {
  Creature,
  CreatureAction,
  CreatureActionAttack,
  CreatureTrait,
} from '~/server/db/schema';
import {
  experienceForChallengeRating,
  formatChallengeRating,
  proficiencyBonusForChallengeRating,
} from '~/utils/formatChallengeRating';
import { abilityScoreToModifier, formatModifier } from '~/utils/formatModifier';
import { slugToTitle } from '~/utils/slugToTitle';

/**
 * Turns the raw library rows into everything a statblock needs to render.
 *
 * Every derivation lives here rather than in the component: ability modifiers,
 * the CR label, XP, proficiency bonus, and the prose forms of speed and
 * senses. The view stays a dumb renderer and all of this is tested in the
 * browser-free unit project.
 */

export type StatblockAbility = {
  key: string;
  label: string;
  score: number;
  modifier: string;
};

export type StatblockEntry = { label: string; value: string };

export type StatblockAction = {
  slug: string;
  name: string;
  desc: string;
  legendaryActionCost: number | null;
};

export type StatblockActionSection = {
  key: string;
  title: string;
  actions: StatblockAction[];
};

export type Statblock = {
  slug: string;
  name: string;
  /** "Large Aberration, lawful evil" */
  subtitle: string;
  armorClass: number;
  armorDetail: string | null;
  hitPoints: number;
  hitDice: string;
  initiativeBonus: number | null;
  challengeRatingLabel: string;
  experiencePoints: number;
  proficiencyBonus: number;
  speed: string;
  senses: string;
  languages: string | null;
  abilities: StatblockAbility[];
  savingThrows: StatblockEntry[];
  skills: StatblockEntry[];
  damageImmunities: string | null;
  damageResistances: string | null;
  damageVulnerabilities: string | null;
  conditionImmunities: string | null;
  traits: { slug: string; name: string; desc: string }[];
  actionSections: StatblockActionSection[];
};

/** Section order matches how a printed statblock reads. */
const ACTION_SECTIONS: ReadonlyArray<readonly [string, string]> = [
  ['ACTION', 'Actions'],
  ['BONUS_ACTION', 'Bonus Actions'],
  ['REACTION', 'Reactions'],
  ['LEGENDARY_ACTION', 'Legendary Actions'],
] as const;

const ABILITIES = [
  ['STR', 'Strength', 'abilityScoreStrength', 'savingThrowStrength'],
  ['DEX', 'Dexterity', 'abilityScoreDexterity', 'savingThrowDexterity'],
  [
    'CON',
    'Constitution',
    'abilityScoreConstitution',
    'savingThrowConstitution',
  ],
  [
    'INT',
    'Intelligence',
    'abilityScoreIntelligence',
    'savingThrowIntelligence',
  ],
  ['WIS', 'Wisdom', 'abilityScoreWisdom', 'savingThrowWisdom'],
  ['CHA', 'Charisma', 'abilityScoreCharisma', 'savingThrowCharisma'],
] as const;

const SKILL_FIELDS = [
  ['skillBonusAcrobatics', 'Acrobatics'],
  ['skillBonusAnimalHandling', 'Animal Handling'],
  ['skillBonusArcana', 'Arcana'],
  ['skillBonusAthletics', 'Athletics'],
  ['skillBonusDeception', 'Deception'],
  ['skillBonusHistory', 'History'],
  ['skillBonusInsight', 'Insight'],
  ['skillBonusIntimidation', 'Intimidation'],
  ['skillBonusInvestigation', 'Investigation'],
  ['skillBonusMedicine', 'Medicine'],
  ['skillBonusNature', 'Nature'],
  ['skillBonusPerception', 'Perception'],
  ['skillBonusPerformance', 'Performance'],
  ['skillBonusPersuasion', 'Persuasion'],
  ['skillBonusReligion', 'Religion'],
  ['skillBonusSleightOfHand', 'Sleight of Hand'],
  ['skillBonusStealth', 'Stealth'],
  ['skillBonusSurvival', 'Survival'],
] as const;

const MOVEMENT_FIELDS = [
  ['walk', 'walk'],
  ['swim', 'swim'],
  ['fly', 'fly'],
  ['climb', 'climb'],
  ['burrow', 'burrow'],
] as const;

const SENSE_FIELDS = [
  ['darkvisionRange', 'darkvision'],
  ['blindsightRange', 'blindsight'],
  ['tremorsenseRange', 'tremorsense'],
  ['truesightRange', 'truesight'],
  ['telepathyRange', 'telepathy'],
] as const;

/** Empty strings from the source read better as absent than as blank. */
const blankToNull = (value: string | null): string | null =>
  value && value.trim().length > 0 ? value : null;

export const buildSubtitle = (creature: Creature): string =>
  `${slugToTitle(creature.size)} ${slugToTitle(creature.type)}, ${creature.alignment}`;

export const buildSpeed = (creature: Creature): string => {
  const parts = MOVEMENT_FIELDS.filter(([field]) => creature[field] != null)
    .map(([field, label]) => `${label} ${creature[field]} ft.`)
    .concat(creature.hover ? ['hover'] : []);

  return parts.length ? parts.join(', ') : '—';
};

export const buildSenses = (creature: Creature): string =>
  [
    ...SENSE_FIELDS.filter(([field]) => creature[field] != null).map(
      ([field, label]) => `${label} ${creature[field]} ft.`,
    ),
    `passive Perception ${creature.passivePerception}`,
  ].join(', ');

export const buildAbilities = (creature: Creature): StatblockAbility[] =>
  ABILITIES.map(([key, label, scoreField]) => {
    const score = creature[scoreField] ?? 10;

    return {
      key,
      label,
      score,
      modifier: formatModifier(abilityScoreToModifier(score)),
    };
  });

export const buildSavingThrows = (creature: Creature): StatblockEntry[] =>
  ABILITIES.filter(([, , , saveField]) => creature[saveField] != null).map(
    ([, label, , saveField]) => ({
      label,
      value: formatModifier(creature[saveField] ?? 0),
    }),
  );

export const buildSkills = (creature: Creature): StatblockEntry[] =>
  SKILL_FIELDS.filter(([field]) => creature[field] != null).map(
    ([field, label]) => ({
      label,
      value: formatModifier(creature[field] ?? 0),
    }),
  );

/**
 * Groups actions into the printed statblock's sections, dropping any section
 * the creature has none of, and ordering within a section by the source's own
 * `sortOrder`.
 */
export const buildActionSections = (
  actions: readonly CreatureAction[],
): StatblockActionSection[] =>
  ACTION_SECTIONS.map(([actionType, title]) => ({
    key: actionType,
    title,
    actions: actions
      .filter(action => action.actionType === actionType)
      .toSorted((left, right) => left.sortOrder - right.sortOrder)
      .map(action => ({
        slug: action.slug,
        name: action.name,
        desc: action.desc,
        legendaryActionCost: action.legendaryActionCost,
      })),
  })).filter(section => section.actions.length > 0);

type BuildStatblockArgs = {
  creature: Creature;
  traits: readonly CreatureTrait[];
  actions: readonly CreatureAction[];
  /** Reserved for rendering structured attack rolls; not yet displayed. */
  attacks?: readonly CreatureActionAttack[];
};

export const buildStatblock = ({
  creature,
  traits,
  actions,
}: BuildStatblockArgs): Statblock => ({
  slug: creature.slug,
  name: creature.name,
  subtitle: buildSubtitle(creature),
  armorClass: creature.armorClass,
  armorDetail: blankToNull(creature.armorDetail),
  hitPoints: creature.hitPoints,
  hitDice: creature.hitDice,
  initiativeBonus: creature.initiativeBonus,
  challengeRatingLabel: formatChallengeRating(creature.challengeRating),
  experiencePoints: experienceForChallengeRating(creature.challengeRating),
  proficiencyBonus: proficiencyBonusForChallengeRating(
    creature.challengeRating,
  ),
  speed: buildSpeed(creature),
  senses: buildSenses(creature),
  languages: blankToNull(creature.languagesDesc),
  abilities: buildAbilities(creature),
  savingThrows: buildSavingThrows(creature),
  skills: buildSkills(creature),
  damageImmunities: blankToNull(creature.damageImmunitiesDisplay),
  damageResistances: blankToNull(creature.damageResistancesDisplay),
  damageVulnerabilities: blankToNull(creature.damageVulnerabilitiesDisplay),
  conditionImmunities: blankToNull(creature.conditionImmunitiesDisplay),
  traits: traits.map(trait => ({
    slug: trait.slug,
    name: trait.name,
    desc: trait.desc,
  })),
  actionSections: buildActionSections(actions),
});
