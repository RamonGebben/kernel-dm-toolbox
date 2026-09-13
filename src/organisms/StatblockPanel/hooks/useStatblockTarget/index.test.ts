import { describe, expect, it } from 'vitest';
import { toStatblockTarget } from '~/organisms/StatblockPanel/hooks/useStatblockTarget';

const dragon = {
  id: 'dragon',
  displayName: 'Meat',
  creatureSlug: 'srd-2024_young-black-dragon',
  customCreatureId: null,
  currentHitPoints: 35,
  maxHitPoints: 52,
  temporaryHitPoints: 0,
  armorClass: 18,
  isHidden: false,
  conditions: [],
};

const sigrid = {
  id: 'sigrid',
  displayName: 'Sigrid',
  creatureSlug: null,
  customCreatureId: null,
  currentHitPoints: 45,
  maxHitPoints: 45,
  temporaryHitPoints: 0,
  armorClass: 20,
  isHidden: false,
  conditions: [],
};

const goblinBoss = {
  id: 'goblin-boss',
  displayName: 'Goblin Boss',
  creatureSlug: null,
  customCreatureId: 'custom-goblin-boss',
  currentHitPoints: 21,
  maxHitPoints: 21,
  temporaryHitPoints: 0,
  armorClass: 17,
  isHidden: false,
  conditions: [],
};

const combatants = [dragon, sigrid, goblinBoss];

describe('toStatblockTarget', () => {
  it('shows nothing when nothing is selected', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCustomCreatureId: null,
        selectedCombatantId: null,
        combatants,
      }),
    ).toEqual({ kind: 'none' });
  });

  it('shows a browsed library creature', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: 'srd-2024_aboleth',
        selectedCustomCreatureId: null,
        selectedCombatantId: null,
        combatants,
      }),
    ).toEqual({
      kind: 'creature',
      slug: 'srd-2024_aboleth',
      combatant: null,
    });
  });

  it('shows a browsed custom creature', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCustomCreatureId: 'custom-goblin-boss',
        selectedCombatantId: null,
        combatants,
      }),
    ).toEqual({
      kind: 'customCreature',
      id: 'custom-goblin-boss',
      combatant: null,
    });
  });

  it('resolves a selected monster combatant to its library statblock', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCustomCreatureId: null,
        selectedCombatantId: 'dragon',
        combatants,
      }),
    ).toEqual({
      kind: 'creature',
      slug: 'srd-2024_young-black-dragon',
      combatant: dragon,
    });
  });

  it('resolves a selected custom-creature combatant to its own statblock', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCustomCreatureId: null,
        selectedCombatantId: 'goblin-boss',
        combatants,
      }),
    ).toEqual({
      kind: 'customCreature',
      id: 'custom-goblin-boss',
      combatant: goblinBoss,
    });
  });

  it('reports a player character, which has no statblock to fetch', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCustomCreatureId: null,
        selectedCombatantId: 'sigrid',
        combatants,
      }),
    ).toEqual({ kind: 'character', combatant: sigrid });
  });

  it('prefers the combatant selection over a stale creature selection', () => {
    const target = toStatblockTarget({
      selectedCreatureSlug: 'srd-2024_aboleth',
      selectedCustomCreatureId: null,
      selectedCombatantId: 'dragon',
      combatants,
    });

    expect(target).toMatchObject({ slug: 'srd-2024_young-black-dragon' });
  });

  it('shows nothing rather than a stale statblock for a removed combatant', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCustomCreatureId: null,
        selectedCombatantId: 'already-removed',
        combatants,
      }),
    ).toEqual({ kind: 'none' });
  });

  it('shows nothing while the encounter is still loading', () => {
    expect(
      toStatblockTarget({
        selectedCreatureSlug: null,
        selectedCustomCreatureId: null,
        selectedCombatantId: 'dragon',
        combatants: [],
      }),
    ).toEqual({ kind: 'none' });
  });
});
