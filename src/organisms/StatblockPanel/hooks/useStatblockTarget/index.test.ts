import { describe, expect, it } from 'vitest';
import { toStatblockTarget } from '~/organisms/StatblockPanel/hooks/useStatblockTarget';

const dragon = {
  id: 'dragon',
  displayName: 'Meat',
  creatureSlug: 'srd-2024_young-black-dragon',
  currentHitPoints: 35,
  maxHitPoints: 52,
  armorClass: 18,
};

const sigrid = {
  id: 'sigrid',
  displayName: 'Sigrid',
  creatureSlug: null,
  currentHitPoints: 45,
  maxHitPoints: 45,
  armorClass: 20,
};

const combatants = [dragon, sigrid];

describe('toStatblockTarget', () => {
  it('shows nothing when nothing is selected', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCombatantId: null,
        combatants,
      }),
    ).toEqual({ kind: 'none' });
  });

  it('shows a browsed library creature', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: 'srd-2024_aboleth',
        selectedCombatantId: null,
        combatants,
      }),
    ).toEqual({
      kind: 'creature',
      slug: 'srd-2024_aboleth',
      combatant: null,
    });
  });

  it('resolves a selected monster combatant to its library statblock', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCombatantId: 'dragon',
        combatants,
      }),
    ).toEqual({
      kind: 'creature',
      slug: 'srd-2024_young-black-dragon',
      combatant: dragon,
    });
  });

  it('reports a player character, which has no statblock to fetch', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCombatantId: 'sigrid',
        combatants,
      }),
    ).toEqual({ kind: 'character', combatant: sigrid });
  });

  it('prefers the combatant selection over a stale creature selection', () => {
    const target = toStatblockTarget({
      selectedCreatureSlug: 'srd-2024_aboleth',
      selectedCombatantId: 'dragon',
      combatants,
    });

    expect(target).toMatchObject({ slug: 'srd-2024_young-black-dragon' });
  });

  it('shows nothing rather than a stale statblock for a removed combatant', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCombatantId: 'already-removed',
        combatants,
      }),
    ).toEqual({ kind: 'none' });
  });

  it('shows nothing while the encounter is still loading', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCombatantId: 'dragon',
        combatants: [],
      }),
    ).toEqual({ kind: 'none' });
  });
});
