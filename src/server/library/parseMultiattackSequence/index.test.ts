import { describe, expect, it } from 'vitest';
import { parseMultiattackSequence } from '~/server/library/parseMultiattackSequence';

describe('parseMultiattackSequence', () => {
  it('parses a single repeated named attack', () => {
    expect(
      parseMultiattackSequence('The dragon makes three Rend attacks.'),
    ).toEqual([{ actionName: 'Rend', count: 3 }]);
  });

  it('parses a single repeated attack with a multi-word name', () => {
    expect(
      parseMultiattackSequence(
        'The elemental makes two Thunderous Slam attacks.',
      ),
    ).toEqual([{ actionName: 'Thunderous Slam', count: 2 }]);
  });

  it('ignores a trailing optional-replace clause after the base sequence', () => {
    expect(
      parseMultiattackSequence(
        'The dragon makes three Rend attacks. It can replace one attack with a use of Spellcasting to cast Shatter (level 3 version).',
      ),
    ).toEqual([{ actionName: 'Rend', count: 3 }]);
  });

  it('parses two distinct named attacks, one each', () => {
    expect(
      parseMultiattackSequence(
        'The ettin makes one Battleaxe attack and one Morningstar attack.',
      ),
    ).toEqual([
      { actionName: 'Battleaxe', count: 1 },
      { actionName: 'Morningstar', count: 1 },
    ]);
  });

  it('parses two distinct named attacks with different counts', () => {
    expect(
      parseMultiattackSequence(
        'The devil makes two Claw attacks and one Infernal Sting attack.',
      ),
    ).toEqual([
      { actionName: 'Claw', count: 2 },
      { actionName: 'Infernal Sting', count: 1 },
    ]);
  });

  it('parses three distinct named attacks', () => {
    expect(
      parseMultiattackSequence(
        'The chimera makes one Ram attack, one Bite attack, and one Claw attack. It can replace the Claw attack with a use of Fire Breath if available.',
      ),
    ).toEqual([
      { actionName: 'Ram', count: 1 },
      { actionName: 'Bite', count: 1 },
      { actionName: 'Claw', count: 1 },
    ]);
  });

  it('returns null for a distributed choice with no fixed per-attack count', () => {
    expect(
      parseMultiattackSequence(
        'The goblin makes two attacks, using Scimitar or Shortbow in any combination.',
      ),
    ).toBeNull();
  });

  it('returns null for an optional-replace clause with no base named attack', () => {
    expect(
      parseMultiattackSequence(
        'The weretiger makes two attacks, using Scratch or Longbow in any combination. It can replace one attack with a Bite attack.',
      ),
    ).toBeNull();
  });

  it('returns null when a clause is not itself an attack', () => {
    expect(
      parseMultiattackSequence(
        'The snake makes one Bite attack and uses Constrict.',
      ),
    ).toBeNull();
  });

  it('returns null for a count that depends on creature state', () => {
    expect(
      parseMultiattackSequence(
        'The hydra makes as many Bite attacks as it has heads.',
      ),
    ).toBeNull();
  });

  it('returns null for unrelated action prose', () => {
    expect(
      parseMultiattackSequence(
        'Melee Attack Roll: +7, reach 5 ft. 7 (1d6 + 4) Piercing damage.',
      ),
    ).toBeNull();
  });
});
