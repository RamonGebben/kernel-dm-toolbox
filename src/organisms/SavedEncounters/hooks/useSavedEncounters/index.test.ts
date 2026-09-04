import { describe, expect, it } from 'vitest';
import { hasSaveableCreatures } from '~/organisms/SavedEncounters/hooks/useSavedEncounters';

describe('hasSaveableCreatures', () => {
  it('reads an absent encounter as nothing to save', () => {
    expect(hasSaveableCreatures(undefined)).toBe(false);
  });

  it('reads an empty board as nothing to save', () => {
    expect(hasSaveableCreatures({ combatants: [] })).toBe(false);
  });

  it('does not count the party — a preset is the opposition', () => {
    expect(hasSaveableCreatures({ combatants: [{ creatureSlug: null }] })).toBe(
      false,
    );
  });

  it('counts a single monster', () => {
    expect(
      hasSaveableCreatures({
        combatants: [{ creatureSlug: null }, { creatureSlug: 'goblin' }],
      }),
    ).toBe(true);
  });
});
