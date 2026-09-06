import { describe, expect, it } from 'vitest';
import { toSpellLibraryState } from '~/organisms/SpellLibrary/hooks/useSpellLibrary';

const fireball = {
  slug: 'srd-2024_fireball',
  name: 'Fireball',
  level: 3,
  school: 'srd-2024_evocation',
};

describe('toSpellLibraryState', () => {
  it('is pending while either query is still pending', () => {
    expect(
      toSpellLibraryState({
        isStatusPending: true,
        isListPending: false,
        status: undefined,
        spells: [],
        classOptions: [],
      }).isPending,
    ).toBe(true);

    expect(
      toSpellLibraryState({
        isStatusPending: false,
        isListPending: true,
        status: { isImported: true },
        spells: undefined,
        classOptions: [],
      }).isPending,
    ).toBe(true);
  });

  it('treats an unknown status as not imported, so the safer state wins', () => {
    expect(
      toSpellLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: undefined,
        spells: [],
        classOptions: [],
      }).isLibraryImported,
    ).toBe(false);
  });

  it('distinguishes an unimported library from a filter with no matches', () => {
    const neverImported = toSpellLibraryState({
      isStatusPending: false,
      isListPending: false,
      status: { isImported: false },
      spells: [],
      classOptions: [],
    });
    const noMatches = toSpellLibraryState({
      isStatusPending: false,
      isListPending: false,
      status: { isImported: true },
      spells: [],
      classOptions: [],
    });

    expect(neverImported.isLibraryImported).toBe(false);
    expect(noMatches.isLibraryImported).toBe(true);
    expect(noMatches.spells).toEqual([]);
  });

  it('defaults an absent list to empty rather than undefined', () => {
    expect(
      toSpellLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
        spells: undefined,
        classOptions: [],
      }).spells,
    ).toEqual([]);
  });

  it('formats level and school for display, stripping the document prefix', () => {
    expect(
      toSpellLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
        spells: [fireball],
        classOptions: [],
      }).spells,
    ).toEqual([
      {
        slug: 'srd-2024_fireball',
        name: 'Fireball',
        levelLabel: '3rd-level',
        school: 'Evocation',
      },
    ]);
  });

  it('renders level 0 as Cantrip', () => {
    expect(
      toSpellLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
        spells: [{ ...fireball, level: 0 }],
        classOptions: [],
      }).spells[0]?.levelLabel,
    ).toBe('Cantrip');
  });

  it('maps class options to filter options, defaulting an absent list to empty', () => {
    expect(
      toSpellLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
        spells: [],
        classOptions: [{ slug: 'srd-2024_wizard', label: 'Wizard' }],
      }).classOptions,
    ).toEqual([{ value: 'srd-2024_wizard', label: 'Wizard' }]);

    expect(
      toSpellLibraryState({
        isStatusPending: false,
        isListPending: false,
        status: { isImported: true },
        spells: [],
        classOptions: undefined,
      }).classOptions,
    ).toEqual([]);
  });
});
