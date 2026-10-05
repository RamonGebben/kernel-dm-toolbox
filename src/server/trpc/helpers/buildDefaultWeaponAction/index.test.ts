import { describe, expect, it } from 'vitest';
import { buildDefaultWeaponAction } from '~/server/trpc/helpers/buildDefaultWeaponAction';

describe('buildDefaultWeaponAction', () => {
  it('builds a class-typical melee weapon with to-hit and damage from level + ability modifier', () => {
    const action = buildDefaultWeaponAction(
      { slug: 'srd-2024_barbarian', subclassOfSlug: null },
      3,
      3,
    );

    expect(action.attack).toMatchObject({
      name: 'Greataxe',
      attackType: 'Melee Weapon Attack',
      reach: 5,
      range: undefined,
      damageDieCount: 1,
      damageDieType: 'd12',
      damageType: 'slashing',
      // proficiency bonus at level 3 (+2) + ability modifier (3)
      toHitMod: 5,
      damageBonus: 3,
    });
  });

  it('builds a ranged weapon with range/longRange instead of reach', () => {
    const action = buildDefaultWeaponAction(
      { slug: 'srd-2024_ranger', subclassOfSlug: null },
      1,
      2,
    );

    expect(action.attack).toMatchObject({
      name: 'Longbow',
      attackType: 'Ranged Weapon Attack',
      reach: undefined,
      range: 150,
      longRange: 600,
    });
  });

  it('falls back to the base class weapon for an unrecognized subclass', () => {
    const action = buildDefaultWeaponAction(
      { slug: 'srd-2024_berserker', subclassOfSlug: 'srd-2024_barbarian' },
      3,
      3,
    );

    expect(action.attack?.name).toBe('Greataxe');
  });

  it("scales a monk's unarmed strike die with level", () => {
    const level5 = buildDefaultWeaponAction(
      { slug: 'srd-2024_monk', subclassOfSlug: null },
      5,
      3,
    );
    const level1 = buildDefaultWeaponAction(
      { slug: 'srd-2024_monk', subclassOfSlug: null },
      1,
      3,
    );

    expect(level1.attack?.damageDieType).toBe('d6');
    expect(level5.attack?.damageDieType).toBe('d8');
  });

  it('falls back to a generic improvised weapon for an unrecognized class', () => {
    const action = buildDefaultWeaponAction(
      { slug: 'srd-2024_artificer', subclassOfSlug: null },
      1,
      0,
    );

    expect(action.attack).toMatchObject({
      name: 'Improvised Weapon',
      damageDieCount: 1,
      damageDieType: 'd4',
      damageType: 'bludgeoning',
    });
  });

  it('marks the attack as targeting creatures only', () => {
    const action = buildDefaultWeaponAction(
      { slug: 'srd-2024_fighter', subclassOfSlug: null },
      1,
      0,
    );

    expect(action.attack?.targetCreatureOnly).toBe(true);
    expect(action.actionType).toBe('ACTION');
  });
});
