import { describe, expect, it } from 'vitest';
import { toPlayerView } from '~/server/encounter/toPlayerView';
import type { EncounterState } from '~/server/encounter/state';

const combatant = (
  overrides: Partial<EncounterState['combatants'][number]> & { id: string },
): EncounterState['combatants'][number] => ({
  displayName: 'Goblin',
  initiative: 12,
  currentHitPoints: 7,
  maxHitPoints: 7,
  temporaryHitPoints: 0,
  armorClass: 15,
  isHidden: false,
  isDelayed: false,
  sortOrder: 0,
  creatureSlug: 'srd-2024_goblin',
  playerCharacterId: null,
  isPlayerCharacter: false,
  healthStatus: 'healthy',
  challengeRating: 0.125,
  ...overrides,
});

const state: EncounterState = {
  roundNumber: 3,
  activeCombatantId: 'dragon',
  combatants: [
    combatant({ id: 'dragon', displayName: 'Young Black Dragon' }),
    combatant({
      id: 'ambusher',
      displayName: 'Assassin',
      isHidden: true,
    }),
    combatant({
      id: 'sigrid',
      displayName: 'Sigrid',
      isPlayerCharacter: true,
      playerCharacterId: 'sigrid-id',
      creatureSlug: null,
      healthStatus: 'bloodied',
    }),
  ],
};

describe('toPlayerView', () => {
  it('omits a hidden combatant entirely, not merely flags it', () => {
    const view = toPlayerView(state);

    expect(view.combatants.map(c => c.id)).toEqual(['dragon', 'sigrid']);
    // The whole payload must not contain the name anywhere.
    expect(JSON.stringify(view)).not.toContain('Assassin');
  });

  it('never leaks exact hit points for anyone', () => {
    const serialised = JSON.stringify(toPlayerView(state));

    expect(serialised).not.toContain('currentHitPoints');
    expect(serialised).not.toContain('maxHitPoints');
    expect(serialised).not.toContain('temporaryHitPoints');
  });

  it('reports health as a status the players could perceive', () => {
    const view = toPlayerView(state);

    expect(view.combatants[1].healthStatus).toBe('bloodied');
  });

  it('marks whose turn it is', () => {
    const view = toPlayerView(state);

    expect(view.combatants.find(c => c.isActive)?.id).toBe('dragon');
  });

  it('marks nobody active between fights', () => {
    const view = toPlayerView({ ...state, activeCombatantId: null });

    expect(view.combatants.some(c => c.isActive)).toBe(false);
  });

  it('carries the round number through', () => {
    expect(toPlayerView(state).roundNumber).toBe(3);
  });

  it('handles an empty encounter', () => {
    expect(
      toPlayerView({ roundNumber: 0, activeCombatantId: null, combatants: [] }),
    ).toEqual({ roundNumber: 0, combatants: [] });
  });
});
