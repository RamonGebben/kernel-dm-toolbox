import { describe, expect, it } from 'vitest';
import {
  parseTokenKey,
  toCreatureOptions,
} from '~/organisms/ScenarioBuilder/hooks/useScenarioBuilder';

describe('toCreatureOptions', () => {
  it('maps a library row to a slug-keyed option', () => {
    expect(
      toCreatureOptions([
        {
          source: 'library',
          name: 'Orc',
          challengeRatingLabel: '1/2',
          slug: 'srd-2024_orc',
        },
      ]),
    ).toEqual([
      {
        key: 'library:srd-2024_orc',
        name: 'Orc',
        challengeRatingLabel: '1/2',
        source: 'library',
        creatureSlug: 'srd-2024_orc',
      },
    ]);
  });

  it('maps a custom-creature row to an id-keyed option', () => {
    expect(
      toCreatureOptions([
        {
          source: 'custom',
          name: 'Swamp Lurker',
          challengeRatingLabel: '3',
          id: 'homebrew-1',
        },
      ]),
    ).toEqual([
      {
        key: 'custom:homebrew-1',
        name: 'Swamp Lurker',
        challengeRatingLabel: '3',
        source: 'custom',
        customCreatureId: 'homebrew-1',
      },
    ]);
  });

  it('returns an empty array for no rows', () => {
    expect(toCreatureOptions([])).toEqual([]);
  });
});

describe('parseTokenKey', () => {
  it('parses a party token key', () => {
    expect(parseTokenKey('party:member-1')).toEqual({
      kind: 'party',
      id: 'member-1',
    });
  });

  it('parses a monster token key', () => {
    expect(parseTokenKey('monster:entry-1')).toEqual({
      kind: 'monster',
      id: 'entry-1',
    });
  });

  it('rejects an unknown prefix', () => {
    expect(parseTokenKey('creature:1')).toBeNull();
  });

  it('rejects a key with no id', () => {
    expect(parseTokenKey('party:')).toBeNull();
  });
});
