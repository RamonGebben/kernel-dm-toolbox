import {
  basicFacilityBuild,
  basicFacilityEnlarge,
  specialFacilityEnlargeDays,
  wallSquare,
} from '~/content/bastion/basicFacilities';
import { findSpecialFacility } from '~/content/bastion/specialFacilities';
import type { BasicFacilityType, FacilitySpace } from '~/content/bastion/types';

export type ProjectRequest =
  | { kind: 'add-basic'; basicType: BasicFacilityType; space: FacilitySpace }
  | { kind: 'enlarge-basic'; facility: { id: string; space: FacilitySpace } }
  | {
      kind: 'enlarge-special';
      facility: { id: string; facilityKey: string; space: FacilitySpace };
    }
  | { kind: 'walls'; squares: number };

/** The row a project becomes, minus the bastion and sync columns. */
export type ProjectPlan = {
  kind: ProjectRequest['kind'];
  basicType: BasicFacilityType | null;
  space: FacilitySpace | null;
  facilityId: string | null;
  wallSquares: number | null;
  costGp: number;
  daysRemaining: number;
};

export type ProjectPlanResult =
  | { ok: true; plan: ProjectPlan }
  | { ok: false; reason: 'already-vast' | 'cannot-enlarge' | 'no-squares' };

const blankPlan = {
  basicType: null,
  space: null,
  facilityId: null,
  wallSquares: null,
} as const;

/**
 * What a construction request costs and how long it takes, straight from the
 * catalog's tables. Pure: the resolver reads the facility, asks this, then
 * charges the treasury and writes the row.
 */
export const planBastionProject = (
  request: ProjectRequest,
): ProjectPlanResult => {
  if (request.kind === 'add-basic') {
    const build = basicFacilityBuild[request.space];

    return {
      ok: true,
      plan: {
        ...blankPlan,
        kind: 'add-basic',
        basicType: request.basicType,
        space: request.space,
        costGp: build.costGp,
        daysRemaining: build.days,
      },
    };
  }

  if (request.kind === 'enlarge-basic') {
    const { space } = request.facility;
    if (space === 'vast') return { ok: false, reason: 'already-vast' };

    const step = basicFacilityEnlarge[space];

    return {
      ok: true,
      plan: {
        ...blankPlan,
        kind: 'enlarge-basic',
        space: step.to,
        facilityId: request.facility.id,
        costGp: step.costGp,
        daysRemaining: step.days,
      },
    };
  }

  if (request.kind === 'enlarge-special') {
    const enlarge = findSpecialFacility(request.facility.facilityKey)?.enlarge;
    if (!enlarge) return { ok: false, reason: 'cannot-enlarge' };
    if (request.facility.space === 'vast')
      return { ok: false, reason: 'already-vast' };

    return {
      ok: true,
      plan: {
        ...blankPlan,
        kind: 'enlarge-special',
        space: 'vast',
        facilityId: request.facility.id,
        costGp: enlarge.costGp,
        daysRemaining: specialFacilityEnlargeDays,
      },
    };
  }

  if (!Number.isInteger(request.squares) || request.squares < 1)
    return { ok: false, reason: 'no-squares' };

  return {
    ok: true,
    plan: {
      ...blankPlan,
      kind: 'walls',
      wallSquares: request.squares,
      costGp: wallSquare.costGp * request.squares,
      daysRemaining: wallSquare.days * request.squares,
    },
  };
};

export type ProjectCompletion =
  | { type: 'insert-basic'; basicType: BasicFacilityType; space: FacilitySpace }
  | { type: 'resize-basic'; facilityId: string; space: FacilitySpace }
  | { type: 'resize-special'; facilityId: string; space: FacilitySpace }
  | { type: 'add-walls'; squares: number };

/**
 * What finishing a project changes. Throws on a malformed row — the check
 * constraints and `planBastionProject` mean it cannot happen, and silently
 * completing a project into nothing would lose the gold already spent.
 */
export const toProjectCompletion = (project: {
  kind: ProjectRequest['kind'];
  basicType: BasicFacilityType | null;
  space: FacilitySpace | null;
  facilityId: string | null;
  wallSquares: number | null;
}): ProjectCompletion => {
  const { kind, basicType, space, facilityId, wallSquares } = project;

  if (kind === 'add-basic' && basicType && space)
    return { type: 'insert-basic', basicType, space };
  if (kind === 'enlarge-basic' && facilityId && space)
    return { type: 'resize-basic', facilityId, space };
  if (kind === 'enlarge-special' && facilityId && space)
    return { type: 'resize-special', facilityId, space };
  if (kind === 'walls' && wallSquares)
    return { type: 'add-walls', squares: wallSquares };

  throw new Error(`Bastion project of kind "${kind}" is missing its target.`);
};
