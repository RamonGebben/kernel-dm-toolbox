import { describe, expect, it } from 'vitest';
import { toCustomCreatureFormValues } from '~/molecules/CustomCreatureForm/toCustomCreatureFormValues';
import type { StatblockSourceCreature } from '~/server/trpc/helpers/buildStatblock';

const goblin: StatblockSourceCreature = {
  slug: 'srd-2024_goblin',
  name: 'Goblin',
  size: 'small',
  type: 'humanoid',
  alignment: 'neutral evil',
  armorClass: 15,
  armorDetail: 'leather armor, shield',
  hitPoints: 7,
  hitDice: '2d6',
  initiativeBonus: 2,
  challengeRating: 0.25,
  abilityScoreStrength: 8,
  abilityScoreDexterity: 14,
  abilityScoreConstitution: 10,
  abilityScoreIntelligence: 10,
  abilityScoreWisdom: 8,
  abilityScoreCharisma: 8,
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
  skillBonusPerception: null,
  skillBonusPerformance: null,
  skillBonusPersuasion: null,
  skillBonusReligion: null,
  skillBonusSleightOfHand: 6,
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
  passivePerception: 9,
  damageImmunitiesDisplay: null,
  damageResistancesDisplay: null,
  damageVulnerabilitiesDisplay: null,
  conditionImmunitiesDisplay: null,
  languagesDesc: 'Common, Goblin',
};

describe('toCustomCreatureFormValues', () => {
  it('carries raw numeric fields through as editable numbers, not modifiers', () => {
    const values = toCustomCreatureFormValues({
      creature: goblin,
      traits: [],
      actions: [],
    });

    expect(values.challengeRating).toBe(0.25);
    expect(values.abilityScores.Dexterity).toBe(14);
    expect(values.armorClass).toBe(15);
  });

  it('renders an absent optional field as a blank string, not "null"', () => {
    const values = toCustomCreatureFormValues({
      creature: goblin,
      traits: [],
      actions: [],
    });

    expect(values.savingThrows.Strength).toBe('');
    expect(values.skills.Stealth).toBe('6');
    expect(values.swim).toBe('');
    expect(values.walk).toBe('30');
  });

  it('maps traits and actions, including a structured attack', () => {
    const values = toCustomCreatureFormValues({
      creature: goblin,
      traits: [{ name: 'Nimble Escape', desc: 'Can disengage.', type: null }],
      actions: [
        {
          name: 'Scimitar',
          desc: 'Melee weapon attack.',
          actionType: 'ACTION',
          legendaryActionCost: null,
          attack: {
            name: 'Scimitar',
            attackType: 'Melee Weapon Attack',
            toHitMod: 4,
            reach: 5,
            range: null,
            longRange: null,
            targetCreatureOnly: false,
            damageDieCount: 1,
            damageDieType: 'd6',
            damageBonus: 2,
            damageType: 'slashing',
            extraDamageDieCount: null,
            extraDamageDieType: null,
            extraDamageBonus: null,
            extraDamageType: null,
          },
        },
      ],
    });

    expect(values.traits).toEqual([
      { name: 'Nimble Escape', desc: 'Can disengage.', type: '' },
    ]);
    expect(values.actions[0]).toMatchObject({
      name: 'Scimitar',
      actionType: 'ACTION',
      legendaryActionCost: '',
    });
    expect(values.actions[0]?.attack).toMatchObject({
      toHitMod: '4',
      damageDieCount: '1',
      damageDieType: 'd6',
      damageType: 'slashing',
    });
  });

  it('leaves a plain action with no attack rows as null', () => {
    const values = toCustomCreatureFormValues({
      creature: goblin,
      traits: [],
      actions: [
        {
          name: 'Nimble Escape',
          desc: 'A bonus action.',
          actionType: 'BONUS_ACTION',
          legendaryActionCost: null,
          attack: null,
        },
      ],
    });

    expect(values.actions[0]?.attack).toBeNull();
  });
});
