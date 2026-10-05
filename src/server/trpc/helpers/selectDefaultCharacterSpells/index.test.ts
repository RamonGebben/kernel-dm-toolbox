import { describe, expect, it } from 'vitest';
import { selectDefaultCharacterSpells } from '~/server/trpc/helpers/selectDefaultCharacterSpells';

describe('selectDefaultCharacterSpells', () => {
  it('picks up to two offensive cantrips, alphabetically', () => {
    const result = selectDefaultCharacterSpells(
      [
        {
          slug: 'fire-bolt',
          name: 'Fire Bolt',
          level: 0,
          attackRoll: true,
          savingThrowAbility: null,
        },
        {
          slug: 'ray-of-frost',
          name: 'Ray of Frost',
          level: 0,
          attackRoll: true,
          savingThrowAbility: null,
        },
        {
          slug: 'acid-splash',
          name: 'Acid Splash',
          level: 0,
          attackRoll: false,
          savingThrowAbility: 'dexterity',
        },
        {
          slug: 'prestidigitation',
          name: 'Prestidigitation',
          level: 0,
          attackRoll: false,
          savingThrowAbility: null,
        },
      ],
      [],
    );

    expect(result).toEqual([
      { spellSlug: 'acid-splash', isPrepared: true, isAlwaysAvailable: true },
      { spellSlug: 'fire-bolt', isPrepared: true, isAlwaysAvailable: true },
    ]);
  });

  it('picks one offensive leveled spell per distinct slot level', () => {
    const result = selectDefaultCharacterSpells(
      [
        {
          slug: 'magic-missile',
          name: 'Magic Missile',
          level: 1,
          attackRoll: false,
          savingThrowAbility: null,
        },
        {
          slug: 'scorching-ray',
          name: 'Scorching Ray',
          level: 2,
          attackRoll: true,
          savingThrowAbility: null,
        },
        {
          slug: 'mage-armor',
          name: 'Mage Armor',
          level: 1,
          attackRoll: false,
          savingThrowAbility: null,
        },
      ],
      [1, 2],
    );

    // Magic Missile has neither an attack roll nor a saving throw upstream
    // (it "automatically hits"), so it's excluded — not offensive by this
    // function's own attack/save-only test — leaving nothing for level 1.
    expect(result).toEqual([
      {
        spellSlug: 'scorching-ray',
        isPrepared: true,
        isAlwaysAvailable: false,
      },
    ]);
  });

  it('falls back to the highest offensive spell at or below the slot level', () => {
    const result = selectDefaultCharacterSpells(
      [
        {
          slug: 'burning-hands',
          name: 'Burning Hands',
          level: 1,
          attackRoll: false,
          savingThrowAbility: 'dexterity',
        },
      ],
      [3],
    );

    expect(result).toEqual([
      {
        spellSlug: 'burning-hands',
        isPrepared: true,
        isAlwaysAvailable: false,
      },
    ]);
  });

  it('never picks a purely utility spell with no attack roll or save', () => {
    const result = selectDefaultCharacterSpells(
      [
        {
          slug: 'detect-magic',
          name: 'Detect Magic',
          level: 1,
          attackRoll: false,
          savingThrowAbility: null,
        },
      ],
      [1],
    );

    expect(result).toEqual([]);
  });

  it('never reuses a spell already picked as a cantrip for a leveled slot', () => {
    // Contrived (a real cantrip and a real level-1 spell never share a slug),
    // but guards the chosen-set logic explicitly rather than only implicitly.
    const result = selectDefaultCharacterSpells(
      [
        {
          slug: 'shared-slug',
          name: 'Shared',
          level: 0,
          attackRoll: true,
          savingThrowAbility: null,
        },
      ],
      [1],
    );

    expect(result).toEqual([
      { spellSlug: 'shared-slug', isPrepared: true, isAlwaysAvailable: true },
    ]);
  });

  it('returns nothing for a non-caster with no candidates and no slot levels', () => {
    expect(selectDefaultCharacterSpells([], [])).toEqual([]);
  });
});
