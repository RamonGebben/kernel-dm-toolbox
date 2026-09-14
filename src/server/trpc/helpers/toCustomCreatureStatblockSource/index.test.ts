import { describe, expect, it } from 'vitest';
import { toCustomCreatureStatblockSource } from '~/server/trpc/helpers/toCustomCreatureStatblockSource';
import { buildStatblock } from '~/server/trpc/helpers/buildStatblock';
import type {
  CustomCreature,
  CustomCreatureAction,
  CustomCreatureTrait,
} from '~/server/db/schema';

const goblinBoss: CustomCreature = {
  id: 'custom-goblin-boss',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  version: 1,
  updatedBy: 'local',
  name: 'Goblin Boss',
  size: 'small',
  type: 'humanoid',
  alignment: 'neutral evil',
  challengeRating: 1,
  armorClass: 17,
  armorDetail: 'chain shirt, shield',
  hitPoints: 21,
  hitDice: '6d6',
  initiativeBonus: 2,
  abilityScoreStrength: 10,
  abilityScoreDexterity: 14,
  abilityScoreConstitution: 10,
  abilityScoreIntelligence: 10,
  abilityScoreWisdom: 8,
  abilityScoreCharisma: 10,
  savingThrowStrength: null,
  savingThrowDexterity: null,
  savingThrowConstitution: null,
  savingThrowIntelligence: null,
  savingThrowWisdom: null,
  savingThrowCharisma: null,
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
  skillBonusPerception: 3,
  skillBonusPerformance: null,
  skillBonusPersuasion: null,
  skillBonusReligion: null,
  skillBonusSleightOfHand: null,
  skillBonusStealth: 6,
  skillBonusSurvival: null,
  walk: 30,
  swim: null,
  fly: null,
  climb: null,
  burrow: null,
  hover: false,
  darkvisionRange: 60,
  blindsightRange: null,
  tremorsenseRange: null,
  truesightRange: null,
  telepathyRange: null,
  passivePerception: 13,
  damageImmunitiesDisplay: null,
  damageResistancesDisplay: null,
  damageVulnerabilitiesDisplay: null,
  conditionImmunitiesDisplay: null,
  languagesDesc: 'Common, Goblin',
};

const trait: CustomCreatureTrait = {
  id: 'trait-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  version: 1,
  updatedBy: 'local',
  customCreatureId: goblinBoss.id,
  name: 'Nimble Escape',
  desc: 'Can disengage or hide as a bonus action.',
  type: null,
};

const action: CustomCreatureAction = {
  id: 'action-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  version: 1,
  updatedBy: 'local',
  customCreatureId: goblinBoss.id,
  name: 'Scimitar',
  desc: 'Melee weapon attack.',
  actionType: 'ACTION',
  sortOrder: 0,
  legendaryActionCost: null,
  usesType: null,
  usesParam: null,
};

describe('toCustomCreatureStatblockSource', () => {
  it('aliases the row id to slug and carries the rest through untouched', () => {
    const { creature } = toCustomCreatureStatblockSource({
      customCreature: goblinBoss,
      traits: [],
      actions: [],
    });

    expect(creature.slug).toBe('custom-goblin-boss');
    expect(creature.name).toBe('Goblin Boss');
    expect(creature.armorClass).toBe(17);
  });

  it('maps traits and actions to the fields buildStatblock reads', () => {
    const source = toCustomCreatureStatblockSource({
      customCreature: goblinBoss,
      traits: [trait],
      actions: [action],
    });

    expect(source.traits).toEqual([
      { slug: 'trait-1', name: 'Nimble Escape', desc: trait.desc },
    ]);
    expect(source.actions).toEqual([
      {
        slug: 'action-1',
        name: 'Scimitar',
        desc: action.desc,
        actionType: 'ACTION',
        sortOrder: 0,
        legendaryActionCost: null,
      },
    ]);
  });

  it('produces a source buildStatblock can actually render', () => {
    const { creature, traits, actions } = toCustomCreatureStatblockSource({
      customCreature: goblinBoss,
      traits: [trait],
      actions: [action],
    });

    const statblock = buildStatblock({ creature, traits, actions });

    expect(statblock).toMatchObject({
      slug: 'custom-goblin-boss',
      name: 'Goblin Boss',
      subtitle: 'Small Humanoid, neutral evil',
      armorClass: 17,
      hitPoints: 21,
    });
    expect(statblock.traits).toEqual([
      { slug: 'trait-1', name: 'Nimble Escape', desc: trait.desc },
    ]);
  });
});
