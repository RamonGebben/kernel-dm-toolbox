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
    expect(
      hasSaveableCreatures({
        combatants: [{ creatureSlug: null, customCreatureId: null }],
      }),
    ).toBe(false);
  });

  it('counts a single library monster', () => {
    expect(
      hasSaveableCreatures({
        combatants: [
          { creatureSlug: null, customCreatureId: null },
          { creatureSlug: 'goblin', customCreatureId: null },
        ],
      }),
    ).toBe(true);
  });

  it('counts a single custom monster', () => {
    expect(
      hasSaveableCreatures({
        combatants: [
          { creatureSlug: null, customCreatureId: null },
          { creatureSlug: null, customCreatureId: 'custom-goblin-boss' },
        ],
      }),
    ).toBe(true);
  });
});
