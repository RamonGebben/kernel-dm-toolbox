import type {
  BasicFacilityType,
  FacilityLevel,
  FacilitySpace,
} from '~/content/bastion/types';

/**
 * The building side of the bastion rules: rooms, sizes, what construction
 * costs and how long it takes. Numbers only (DECISIONS #33).
 */

export const basicFacilityTypes: readonly {
  type: BasicFacilityType;
  label: string;
}[] = [
  { type: 'bedroom', label: 'Bedroom' },
  { type: 'dining-room', label: 'Dining Room' },
  { type: 'parlor', label: 'Parlor' },
  { type: 'courtyard', label: 'Courtyard' },
  { type: 'kitchen', label: 'Kitchen' },
  { type: 'storage', label: 'Storage' },
];

export const isBasicFacilityType = (
  value: string,
): value is BasicFacilityType =>
  basicFacilityTypes.some(({ type }) => type === value);

export const facilitySpaces: readonly {
  space: FacilitySpace;
  label: string;
  /** Maximum area in 5-foot squares. */
  squares: number;
}[] = [
  { space: 'cramped', label: 'Cramped', squares: 4 },
  { space: 'roomy', label: 'Roomy', squares: 16 },
  { space: 'vast', label: 'Vast', squares: 36 },
];

/** Adding a new basic facility of each size. */
export const basicFacilityBuild: Readonly<
  Record<FacilitySpace, { costGp: number; days: number }>
> = {
  cramped: { costGp: 500, days: 20 },
  roomy: { costGp: 1000, days: 45 },
  vast: { costGp: 3000, days: 125 },
};

/** Enlarging a basic facility one step. Vast is as big as it gets. */
export const basicFacilityEnlarge: Readonly<
  Record<
    'cramped' | 'roomy',
    { to: FacilitySpace; costGp: number; days: number }
  >
> = {
  cramped: { to: 'roomy', costGp: 500, days: 25 },
  roomy: { to: 'vast', costGp: 2000, days: 80 },
};

/**
 * Enlarging a special facility to Vast. The rules give the cost but no build
 * time; borrowing the basic Roomy → Vast step's 80 days is our call
 * (DECISIONS #33).
 */
export const specialFacilityEnlargeDays = 80;

/** Defensive walls: per 5-foot square, 20 feet high. */
export const wallSquare = { costGp: 250, days: 10 } as const;

/** Defenders a Barrack houses: 12, or 25 once enlarged to Vast. */
export const barrackCapacity: Readonly<Record<'roomy' | 'vast', number>> = {
  roomy: 12,
  vast: 25,
};

/** The level a character gains a bastion at. */
export const bastionLevel = 5;

/**
 * Special facilities held in total, by the owner's level. A character gains
 * them as they level and cannot buy more.
 */
export const specialFacilityAllowance: readonly {
  level: FacilityLevel;
  total: number;
}[] = [
  { level: 5, total: 2 },
  { level: 9, total: 4 },
  { level: 13, total: 5 },
  { level: 17, total: 6 },
];

/** A new bastion starts with one Cramped and one Roomy basic facility, free. */
export const startingBasicSpaces: readonly FacilitySpace[] = [
  'cramped',
  'roomy',
];
