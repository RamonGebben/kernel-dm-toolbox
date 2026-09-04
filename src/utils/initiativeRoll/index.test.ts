import { describe, expect, it } from 'vitest';
import {
  rerollMonsterDrafts,
  toInitiativeDrafts,
  toInitiativeValues,
  type InitiativeRollEntry,
} from '~/utils/initiativeRoll';

const goblin: InitiativeRollEntry = {
  id: 'goblin',
  isPlayerCharacter: false,
  initiative: 14,
  initiativeBonus: 2,
};

const cleric: InitiativeRollEntry = {
  id: 'cleric',
  isPlayerCharacter: true,
  initiative: 3,
  initiativeBonus: null,
};

describe('toInitiativeDrafts', () => {
  it('prefills a monster with the initiative it already rolled', () => {
    expect(toInitiativeDrafts([goblin])).toEqual({ goblin: '14' });
  });

  it('leaves a player character blank for the DM to type', () => {
    expect(toInitiativeDrafts([cleric])).toEqual({ cleric: '' });
  });
});

describe('rerollMonsterDrafts', () => {
  it('rerolls monsters with their bonus and keeps what the DM typed', () => {
    const drafts = rerollMonsterDrafts(
      [goblin, cleric],
      { goblin: '14', cleric: '18' },
      () => 10,
    );

    expect(drafts).toEqual({ goblin: '12', cleric: '18' });
  });
});

describe('toInitiativeValues', () => {
  it('parses what was typed', () => {
    expect(
      toInitiativeValues([goblin, cleric], { goblin: '9', cleric: '18' }),
    ).toEqual([
      { id: 'goblin', initiative: 9 },
      { id: 'cleric', initiative: 18 },
    ]);
  });

  it('falls back to the current initiative for a blank field', () => {
    expect(toInitiativeValues([cleric], { cleric: '' })).toEqual([
      { id: 'cleric', initiative: 3 },
    ]);
  });

  it('falls back for a field that is not a number', () => {
    expect(toInitiativeValues([goblin], { goblin: 'nat 20' })).toEqual([
      { id: 'goblin', initiative: 14 },
    ]);
  });

  it('handles a negative roll', () => {
    expect(toInitiativeValues([cleric], { cleric: '-2' })).toEqual([
      { id: 'cleric', initiative: -2 },
    ]);
  });
});
