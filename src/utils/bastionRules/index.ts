import {
  barrackCapacity,
  basicFacilityTypes,
  bastionLevel,
  facilitySpaces,
  specialFacilityAllowance,
} from '~/content/bastion/basicFacilities';
import { facilityPrerequisites } from '~/content/bastion/prerequisites';
import type {
  BasicFacilityType,
  FacilityLevel,
  FacilityPrerequisite,
  FacilitySpace,
  SpecialFacilityDefinition,
} from '~/content/bastion/types';

/**
 * The bastion rules that are pure arithmetic over the catalog — what an
 * owner may hold, what a facility staffs, what the barracks house. No I/O,
 * so both the server and the UI can ask the same questions.
 */

/** Special facilities held in total at this level; 0 below level 5. */
export const allowanceForLevel = (level: number): number =>
  specialFacilityAllowance
    .filter(step => level >= step.level)
    .reduce((_, step) => step.total, 0);

/** The highest facility tier unlocked at this level, or null below 5. */
export const unlockedFacilityLevel = (level: number): FacilityLevel | null =>
  specialFacilityAllowance
    .filter(step => level >= step.level)
    .reduce<FacilityLevel | null>((_, step) => step.level, null);

export const canFoundBastion = (level: number): boolean =>
  level >= bastionLevel;

export const meetsPrerequisite = (
  prerequisite: FacilityPrerequisite | null,
  className: string | null,
): boolean => {
  if (!prerequisite) return true;
  if (!className) return false;

  return (
    facilityPrerequisites[prerequisite].classes as readonly string[]
  ).includes(className);
};

export type EligibilityProblem =
  | { kind: 'level'; requiredLevel: FacilityLevel }
  | { kind: 'prerequisite'; label: string }
  | { kind: 'duplicate' }
  | { kind: 'allowance'; allowance: number };

type Owner = { level: number; className: string | null };

/**
 * Why this owner cannot take this facility right now — an empty list means
 * they can. Every problem is reported, not just the first, so the picker can
 * explain itself fully. The DM may still override (DECISIONS #33).
 */
export const findEligibilityProblems = (
  facility: Pick<
    SpecialFacilityDefinition,
    'key' | 'level' | 'prerequisite' | 'allowMultiple'
  >,
  owner: Owner,
  heldFacilityKeys: readonly string[],
): EligibilityProblem[] => {
  const allowance = allowanceForLevel(owner.level);

  const problems: (EligibilityProblem | null)[] = [
    owner.level < facility.level
      ? { kind: 'level', requiredLevel: facility.level }
      : null,
    meetsPrerequisite(facility.prerequisite, owner.className)
      ? null
      : {
          kind: 'prerequisite',
          label: facility.prerequisite
            ? facilityPrerequisites[facility.prerequisite].label
            : '',
        },
    !facility.allowMultiple && heldFacilityKeys.includes(facility.key)
      ? { kind: 'duplicate' }
      : null,
    heldFacilityKeys.length >= allowance
      ? { kind: 'allowance', allowance }
      : null,
  ];

  return problems.filter((problem): problem is EligibilityProblem =>
    Boolean(problem),
  );
};

/** One line per problem, for a picker row or a warning. */
export const describeEligibilityProblem = (
  problem: EligibilityProblem,
): string => {
  if (problem.kind === 'level')
    return `Needs character level ${problem.requiredLevel}`;
  if (problem.kind === 'prerequisite') return problem.label;
  if (problem.kind === 'duplicate') return 'Already in this bastion';

  return `All ${problem.allowance} facilities for this level are taken`;
};

/** Hirelings a facility comes with, including any from enlarging it. */
export const hirelingCount = (
  facility: Pick<SpecialFacilityDefinition, 'hirelings' | 'enlarge'>,
  isEnlarged: boolean,
): number =>
  facility.hirelings +
  (isEnlarged ? (facility.enlarge?.extraHirelings ?? 0) : 0);

/**
 * How many Bastion Defenders the barracks house: 12 per Barrack, 25 for a
 * Vast one. Other defenders (a guest mercenary, menagerie beasts) need no
 * bunk, so this is a guide, not a cap.
 */
export const defenderCapacity = (
  facilities: readonly { facilityKey: string; space: FacilitySpace }[],
): number =>
  facilities
    .filter(facility => facility.facilityKey === 'barrack')
    .reduce(
      (total, facility) =>
        total +
        (facility.space === 'vast'
          ? barrackCapacity.vast
          : barrackCapacity.roomy),
      0,
    );

export const spaceLabel = (space: FacilitySpace): string =>
  facilitySpaces.find(entry => entry.space === space)?.label ?? space;

export const basicTypeLabel = (type: BasicFacilityType): string =>
  basicFacilityTypes.find(entry => entry.type === type)?.label ?? type;
