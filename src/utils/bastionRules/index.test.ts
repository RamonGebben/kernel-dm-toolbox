import { describe, expect, it } from 'vitest';
import {
  allowanceForLevel,
  basicTypeLabel,
  canFoundBastion,
  defenderCapacity,
  describeEligibilityProblem,
  findEligibilityProblems,
  hirelingCount,
  meetsPrerequisite,
  spaceLabel,
  unlockedFacilityLevel,
} from '~/utils/bastionRules';

describe('allowanceForLevel', () => {
  it.each([
    [4, 0],
    [5, 2],
    [8, 2],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('level %i holds %i special facilities', (level, total) => {
    expect(allowanceForLevel(level)).toBe(total);
  });
});

describe('unlockedFacilityLevel', () => {
  it('unlocks nothing below level 5', () => {
    expect(unlockedFacilityLevel(4)).toBeNull();
  });

  it('unlocks the highest tier reached', () => {
    expect(unlockedFacilityLevel(10)).toBe(9);
    expect(unlockedFacilityLevel(20)).toBe(17);
  });
});

describe('canFoundBastion', () => {
  it('starts at level 5', () => {
    expect(canFoundBastion(4)).toBe(false);
    expect(canFoundBastion(5)).toBe(true);
  });
});

describe('meetsPrerequisite', () => {
  it('lets anyone take a facility with no prerequisite', () => {
    expect(meetsPrerequisite(null, null)).toBe(true);
  });

  it('checks the class against the prerequisite', () => {
    expect(meetsPrerequisite('arcane-focus', 'Wizard')).toBe(true);
    expect(meetsPrerequisite('arcane-focus', 'Fighter')).toBe(false);
    expect(meetsPrerequisite('holy-or-druidic-focus', 'Paladin')).toBe(true);
  });

  it('cannot confirm a prerequisite without a class', () => {
    expect(meetsPrerequisite('skill-expertise', null)).toBe(false);
  });
});

describe('findEligibilityProblems', () => {
  const arcaneStudy = {
    key: 'arcane-study',
    level: 5,
    prerequisite: 'arcane-focus',
  } as const;
  const barrack = {
    key: 'barrack',
    level: 5,
    prerequisite: null,
    allowMultiple: true,
  } as const;
  const archive = { key: 'archive', level: 13, prerequisite: null } as const;
  const wizard = { level: 5, className: 'Wizard' };

  it('finds nothing wrong with an eligible pick', () => {
    expect(findEligibilityProblems(arcaneStudy, wizard, [])).toEqual([]);
  });

  it('flags a facility above the owner level', () => {
    expect(findEligibilityProblems(archive, wizard, [])).toEqual([
      { kind: 'level', requiredLevel: 13 },
    ]);
  });

  it('flags an unmet prerequisite', () => {
    expect(
      findEligibilityProblems(
        arcaneStudy,
        { level: 5, className: 'Rogue' },
        [],
      ),
    ).toEqual([
      {
        kind: 'prerequisite',
        label: 'Can use an Arcane Focus or a tool as a Spellcasting Focus',
      },
    ]);
  });

  it('flags a second copy of a one-of facility', () => {
    expect(
      findEligibilityProblems(arcaneStudy, wizard, ['arcane-study']),
    ).toContainEqual({ kind: 'duplicate' });
  });

  it('allows a second Barrack', () => {
    expect(findEligibilityProblems(barrack, wizard, ['barrack'])).toEqual([]);
  });

  it('flags a full allowance', () => {
    expect(
      findEligibilityProblems(barrack, wizard, ['barrack', 'garden']),
    ).toEqual([{ kind: 'allowance', allowance: 2 }]);
  });

  it('reports every problem at once', () => {
    expect(
      findEligibilityProblems(archive, { level: 5, className: null }, [
        'archive',
        'garden',
      ]).map(problem => problem.kind),
    ).toEqual(['level', 'duplicate', 'allowance']);
  });
});

describe('describeEligibilityProblem', () => {
  it('explains each problem in a line', () => {
    expect(
      describeEligibilityProblem({ kind: 'level', requiredLevel: 9 }),
    ).toBe('Needs character level 9');
    expect(describeEligibilityProblem({ kind: 'duplicate' })).toBe(
      'Already in this bastion',
    );
    expect(
      describeEligibilityProblem({ kind: 'allowance', allowance: 4 }),
    ).toBe('All 4 facilities for this level are taken');
  });
});

describe('hirelingCount', () => {
  const pub = {
    hirelings: 1,
    enlarge: { costGp: 2000, summary: '', extraHirelings: 3 },
  };

  it('uses the base count until enlarged', () => {
    expect(hirelingCount(pub, false)).toBe(1);
  });

  it('adds the enlargement hirelings', () => {
    expect(hirelingCount(pub, true)).toBe(4);
  });

  it('ignores enlargement for a facility that cannot be enlarged', () => {
    expect(hirelingCount({ hirelings: 2 }, true)).toBe(2);
  });
});

describe('defenderCapacity', () => {
  it('houses nobody without a Barrack', () => {
    expect(defenderCapacity([{ facilityKey: 'garden', space: 'roomy' }])).toBe(
      0,
    );
  });

  it('adds up every Barrack, 25 for a Vast one', () => {
    expect(
      defenderCapacity([
        { facilityKey: 'barrack', space: 'roomy' },
        { facilityKey: 'barrack', space: 'vast' },
      ]),
    ).toBe(37);
  });
});

describe('labels', () => {
  it('names sizes and rooms the way the book does', () => {
    expect(spaceLabel('vast')).toBe('Vast');
    expect(basicTypeLabel('dining-room')).toBe('Dining Room');
  });
});
