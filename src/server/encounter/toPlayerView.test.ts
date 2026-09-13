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
  customCreatureId: null,
  initiativeBonus: 2,
  playerCharacterId: null,
  isPlayerCharacter: false,
  healthStatus: 'healthy',
  challengeRating: 0.125,
  conditions: [],
  ...overrides,
});

/** Difficulty is DM-facing only; the player view must never carry it. */
const difficulty = {
  totalExperience: 2900,
  budget: { low: 2000, moderate: 3000, high: 4400 },
  difficulty: 'moderate' as const,
  hasParty: true,
};

const state: EncounterState = {
  roundNumber: 3,
  activeCombatantId: 'dragon',
  difficulty,
  combatants: [
    combatant({
      id: 'dragon',
      displayName: 'Young Black Dragon',
      conditions: [
        {
          id: 'cond-1',
          conditionSlug: 'poisoned',
          name: 'Poisoned',
          roundsRemaining: 2,
          note: 'Will shed the poison next turn — twist ending planned',
        },
      ],
    }),
    combatant({
      id: 'ambusher',
      displayName: 'Assassin',
      isHidden: true,
      conditions: [
        {
          id: 'cond-2',
          conditionSlug: 'invisible',
          name: 'Invisible',
          roundsRemaining: null,
          note: null,
        },
      ],
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

  it('never sends the difficulty rating to the players', () => {
    const serialised = JSON.stringify(toPlayerView(state));

    expect(serialised).not.toContain('difficulty');
    expect(serialised).not.toContain('2900');
  });

  it('carries the round number through', () => {
    expect(toPlayerView(state).roundNumber).toBe(3);
  });

  it("carries a visible combatant's condition name", () => {
    const view = toPlayerView(state);
    const dragon = view.combatants.find(c => c.id === 'dragon');

    expect(dragon?.conditions).toEqual([
      { conditionSlug: 'poisoned', name: 'Poisoned' },
    ]);
  });

  it('never leaks a condition note or its rounds remaining', () => {
    const serialised = JSON.stringify(toPlayerView(state));

    expect(serialised).not.toContain('twist ending');
    expect(serialised).not.toContain('roundsRemaining');
  });

  it("omits a hidden combatant's conditions entirely, along with the rest of it", () => {
    const serialised = JSON.stringify(toPlayerView(state));

    expect(serialised).not.toContain('Invisible');
    expect(serialised).not.toContain('invisible');
  });

  it('handles an empty encounter', () => {
    expect(
      toPlayerView({
        roundNumber: 0,
        activeCombatantId: null,
        combatants: [],
        difficulty,
      }),
    ).toEqual({ roundNumber: 0, combatants: [] });
  });
});
