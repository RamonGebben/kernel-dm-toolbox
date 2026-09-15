import { describe, expect, it } from 'vitest';
import { toPlayerCharacterCombatDataFormValues } from '~/molecules/PlayerCharacterCombatDataForm/toPlayerCharacterCombatDataFormValues';

describe('toPlayerCharacterCombatDataFormValues', () => {
  it('converts an action with an attack into form values', () => {
    const result = toPlayerCharacterCombatDataFormValues({
      actions: [
        {
          name: 'Longsword',
          desc: 'A melee weapon attack.',
          actionType: 'ACTION',
          legendaryActionCost: null,
          attack: {
            name: 'Longsword',
            attackType: 'Melee Weapon Attack',
            toHitMod: 5,
            reach: 5,
            range: null,
            longRange: null,
            targetCreatureOnly: false,
            damageDieCount: 1,
            damageDieType: 'd8',
            damageBonus: 3,
            damageType: 'slashing',
            extraDamageDieCount: null,
            extraDamageDieType: null,
            extraDamageBonus: null,
            extraDamageType: null,
          },
        },
      ],
      spells: [],
      spellSlots: [],
      resources: [],
      spellNamesBySlug: new Map(),
    });

    expect(result.actions).toEqual([
      {
        name: 'Longsword',
        desc: 'A melee weapon attack.',
        actionType: 'ACTION',
        legendaryActionCost: '',
        attack: {
          name: 'Longsword',
          attackType: 'Melee Weapon Attack',
          toHitMod: '5',
          reach: '5',
          range: '',
          longRange: '',
          targetCreatureOnly: false,
          damageDieCount: '1',
          damageDieType: 'd8',
          damageBonus: '3',
          damageType: 'slashing',
          extraDamageDieCount: '',
          extraDamageDieType: '',
          extraDamageBonus: '',
          extraDamageType: '',
        },
      },
    ]);
  });

  it('resolves a spell name from the lookup map, falling back to the slug', () => {
    const result = toPlayerCharacterCombatDataFormValues({
      actions: [],
      spells: [
        {
          spellSlug: 'srd-2024_fire-bolt',
          isPrepared: true,
          isAlwaysAvailable: true,
        },
        {
          spellSlug: 'srd-2024_unknown-spell',
          isPrepared: false,
          isAlwaysAvailable: false,
        },
      ],
      spellSlots: [],
      resources: [],
      spellNamesBySlug: new Map([['srd-2024_fire-bolt', 'Fire Bolt']]),
    });

    expect(result.spells).toEqual([
      {
        spellSlug: 'srd-2024_fire-bolt',
        name: 'Fire Bolt',
        isPrepared: true,
        isAlwaysAvailable: true,
      },
      {
        spellSlug: 'srd-2024_unknown-spell',
        name: 'srd-2024_unknown-spell',
        isPrepared: false,
        isAlwaysAvailable: false,
      },
    ]);
  });

  it('fills all nine spell-slot levels, defaulting missing ones to zero', () => {
    const result = toPlayerCharacterCombatDataFormValues({
      actions: [],
      spells: [],
      spellSlots: [{ spellLevel: 2, maxSlots: 3 }],
      resources: [],
      spellNamesBySlug: new Map(),
    });

    expect(result.spellSlots).toHaveLength(9);
    expect(result.spellSlots[0]).toEqual({ spellLevel: 1, maxSlots: '0' });
    expect(result.spellSlots[1]).toEqual({ spellLevel: 2, maxSlots: '3' });
  });

  it('converts a resource, including an unlimited one with a null maxUses', () => {
    const result = toPlayerCharacterCombatDataFormValues({
      actions: [],
      spells: [],
      spellSlots: [],
      resources: [
        {
          resourceKey: 'rage',
          name: 'Rage',
          maxUses: null,
          isUnlimited: true,
          resetsOn: 'LONG_REST',
        },
      ],
      spellNamesBySlug: new Map(),
    });

    expect(result.resources).toEqual([
      {
        resourceKey: 'rage',
        name: 'Rage',
        maxUses: '0',
        isUnlimited: true,
        resetsOn: 'LONG_REST',
      },
    ]);
  });
});
