import { describe, expect, it } from 'vitest';
import {
  buildAbilities,
  buildActionSections,
  buildSavingThrows,
  buildSenses,
  buildSkills,
  buildSpeed,
  buildStatblock,
  buildSubtitle,
} from '~/server/trpc/helpers/buildStatblock';
import type {
  Creature,
  CreatureAction,
  CreatureTrait,
} from '~/server/db/schema';

/** The young black dragon from the reference screenshot. */
const dragon: Creature = {
  slug: 'srd-2024_young-black-dragon',
  document: 'srd-2024',
  name: 'Young Black Dragon',
  size: 'large',
  type: 'dragon',
  category: 'Monsters',
  alignment: 'chaotic evil',
  challengeRating: 7,
  armorClass: 18,
  armorDetail: 'natural armor',
  hitPoints: 127,
  hitDice: '15d10 + 45',
  initiativeBonus: 5,
  abilityScoreStrength: 19,
  abilityScoreDexterity: 14,
  abilityScoreConstitution: 17,
  abilityScoreIntelligence: 12,
  abilityScoreWisdom: 11,
  abilityScoreCharisma: 15,
  savingThrowStrength: 4,
  savingThrowDexterity: 5,
  savingThrowConstitution: 3,
  savingThrowIntelligence: 1,
  savingThrowWisdom: 3,
  savingThrowCharisma: 2,
  skillBonusAcrobatics: null,
  skillBonusAnimalHandling: null,
  skillBonusArcana: null,
  skillBonusAthletics: null,
  skillBonusDeception: null,
  skillBonusHistory: null,
  skillBonusInsight: null,
  skillBonusIntimidation: null,
  skillBonusInvestigation: null,
  skillBonusMedicine: null,
  skillBonusNature: null,
  skillBonusPerception: 6,
  skillBonusPerformance: null,
  skillBonusPersuasion: null,
  skillBonusReligion: null,
  skillBonusSleightOfHand: null,
  skillBonusStealth: 5,
  skillBonusSurvival: null,
  walk: 40,
  swim: 40,
  fly: 80,
  climb: null,
  burrow: null,
  hover: false,
  darkvisionRange: 120,
  blindsightRange: 30,
  tremorsenseRange: null,
  truesightRange: null,
  telepathyRange: null,
  passivePerception: 16,
  damageImmunities: ['acid'],
  damageImmunitiesDisplay: 'acid',
  damageResistances: [],
  damageResistancesDisplay: '',
  damageVulnerabilities: [],
  damageVulnerabilitiesDisplay: null,
  conditionImmunities: [],
  conditionImmunitiesDisplay: null,
  nonmagicalAttackImmunity: false,
  nonmagicalAttackResistance: false,
  languages: ['common', 'draconic'],
  languagesDesc: 'Common, Draconic',
};

const action = (
  overrides: Partial<CreatureAction> & Pick<CreatureAction, 'slug'>,
): CreatureAction => ({
  creatureSlug: dragon.slug,
  name: 'Bite',
  desc: 'Melee attack.',
  actionType: 'ACTION',
  sortOrder: 0,
  legendaryActionCost: null,
  usesType: null,
  usesParam: null,
  ...overrides,
});

const trait: CreatureTrait = {
  slug: 'srd-2024_young-black-dragon_amphibious',
  creatureSlug: dragon.slug,
  name: 'Amphibious',
  desc: 'The dragon can breathe air and water.',
  type: null,
};

describe('buildSubtitle', () => {
  it('reads the way a printed statblock does', () => {
    expect(buildSubtitle(dragon)).toBe('Large Dragon, chaotic evil');
  });
});

describe('buildSpeed', () => {
  it('lists only the movement modes the creature has', () => {
    expect(buildSpeed(dragon)).toBe('walk 40 ft., swim 40 ft., fly 80 ft.');
  });

  it('appends hover when the creature hovers', () => {
    expect(buildSpeed({ ...dragon, hover: true })).toContain('hover');
  });

  it('falls back to a dash for a creature that cannot move', () => {
    expect(buildSpeed({ ...dragon, walk: null, swim: null, fly: null })).toBe(
      '—',
    );
  });
});

describe('buildSenses', () => {
  it('lists ranged senses and always ends with passive Perception', () => {
    expect(buildSenses(dragon)).toBe(
      'darkvision 120 ft., blindsight 30 ft., passive Perception 16',
    );
  });

  it('still reports passive Perception with no special senses', () => {
    expect(
      buildSenses({ ...dragon, darkvisionRange: null, blindsightRange: null }),
    ).toBe('passive Perception 16');
  });
});

describe('buildAbilities', () => {
  it('returns all six in printed order with signed modifiers', () => {
    const abilities = buildAbilities(dragon);

    expect(abilities.map(a => a.key)).toEqual([
      'STR',
      'DEX',
      'CON',
      'INT',
      'WIS',
      'CHA',
    ]);
    expect(abilities[0]).toMatchObject({ score: 19, modifier: '+4' });
    expect(abilities[4]).toMatchObject({ score: 11, modifier: '+0' });
  });

  it('treats a missing score as 10 rather than crashing', () => {
    const abilities = buildAbilities({
      ...dragon,
      abilityScoreConstitution: null,
    });

    expect(abilities[2]).toMatchObject({ score: 10, modifier: '+0' });
  });
});

describe('buildSavingThrows and buildSkills', () => {
  it('includes only the saves the creature is proficient in', () => {
    const saves = buildSavingThrows({
      ...dragon,
      savingThrowStrength: null,
      savingThrowIntelligence: null,
      savingThrowWisdom: null,
      savingThrowCharisma: null,
    });

    expect(saves).toEqual([
      { label: 'Dexterity', value: '+5' },
      { label: 'Constitution', value: '+3' },
    ]);
  });

  it('includes only skills with a bonus, and signs them', () => {
    expect(buildSkills(dragon)).toEqual([
      { label: 'Perception', value: '+6' },
      { label: 'Stealth', value: '+5' },
    ]);
  });
});

describe('buildActionSections', () => {
  const actions = [
    action({ slug: 'b', name: 'Bite', sortOrder: 1 }),
    action({ slug: 'a', name: 'Multiattack', sortOrder: 0 }),
    action({ slug: 'r', name: 'Dodge', actionType: 'REACTION' }),
    action({
      slug: 'l',
      name: 'Frightful Presence',
      actionType: 'LEGENDARY_ACTION',
      legendaryActionCost: 2,
    }),
  ];

  it('orders sections the way a statblock prints them', () => {
    expect(buildActionSections(actions).map(s => s.title)).toEqual([
      'Actions',
      'Reactions',
      'Legendary Actions',
    ]);
  });

  it('omits a section the creature has no actions for', () => {
    expect(buildActionSections(actions).map(s => s.key)).not.toContain(
      'BONUS_ACTION',
    );
  });

  it('sorts within a section by the source ordering, not by name', () => {
    const [actionsSection] = buildActionSections(actions);

    expect(actionsSection.actions.map(a => a.name)).toEqual([
      'Multiattack',
      'Bite',
    ]);
  });

  it('carries the legendary action cost through', () => {
    const legendary = buildActionSections(actions).at(-1);

    expect(legendary?.actions[0].legendaryActionCost).toBe(2);
  });

  it('returns nothing for a creature with no actions', () => {
    expect(buildActionSections([])).toEqual([]);
  });
});

describe('buildStatblock', () => {
  const statblock = buildStatblock({
    creature: dragon,
    traits: [trait],
    actions: [action({ slug: 'bite' })],
  });

  it('derives XP and proficiency bonus, which are absent from the data', () => {
    expect(statblock.experiencePoints).toBe(2900);
    expect(statblock.proficiencyBonus).toBe(3);
  });

  it('labels the challenge rating', () => {
    expect(statblock.challengeRatingLabel).toBe('7');
  });

  it('treats an empty display string as absent', () => {
    expect(statblock.damageResistances).toBeNull();
    expect(statblock.damageImmunities).toBe('acid');
  });

  it('carries traits through untouched', () => {
    expect(statblock.traits).toEqual([
      {
        slug: trait.slug,
        name: 'Amphibious',
        desc: 'The dragon can breathe air and water.',
      },
    ]);
  });

  it('matches the reference statblock on the headline numbers', () => {
    expect(statblock).toMatchObject({
      name: 'Young Black Dragon',
      subtitle: 'Large Dragon, chaotic evil',
      armorClass: 18,
      armorDetail: 'natural armor',
      hitPoints: 127,
      hitDice: '15d10 + 45',
    });
  });
});
