import { describe, expect, it } from 'vitest';
import {
  findSpecialFacility,
  specialFacilities,
} from '~/content/bastion/specialFacilities';

const keysWhere = (
  predicate: (facility: (typeof specialFacilities)[number]) => boolean,
) =>
  specialFacilities
    .filter(predicate)
    .map(facility => facility.key)
    .sort();

describe('specialFacilities', () => {
  it('holds the 29 core facilities', () => {
    expect(specialFacilities).toHaveLength(29);
  });

  it('has unique keys', () => {
    const keys = specialFacilities.map(facility => facility.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has unique option keys within each facility', () => {
    specialFacilities.forEach(facility => {
      const keys = facility.orderOptions.map(option => option.key);

      expect(new Set(keys).size, facility.key).toBe(keys.length);
    });
  });

  it('gives every facility at least one order option', () => {
    specialFacilities.forEach(facility => {
      expect(facility.orderOptions.length, facility.key).toBeGreaterThan(0);
    });
  });

  it('allows duplicates of exactly Barrack, Garden, Stable and Training Area', () => {
    expect(keysWhere(facility => facility.allowMultiple === true)).toEqual([
      'barrack',
      'garden',
      'stable',
      'training-area',
    ]);
  });

  it('lets exactly six facilities be enlarged, each for 2,000 GP', () => {
    expect(keysWhere(facility => facility.enlarge !== undefined)).toEqual([
      'archive',
      'barrack',
      'garden',
      'pub',
      'stable',
      'workshop',
    ]);
    specialFacilities.forEach(facility => {
      if (facility.enlarge) expect(facility.enlarge.costGp).toBe(2000);
    });
  });

  it('unlocks 9 / 10 / 6 / 4 facilities at levels 5 / 9 / 13 / 17', () => {
    const countAt = (level: number) =>
      specialFacilities.filter(facility => facility.level === level).length;

    expect([countAt(5), countAt(9), countAt(13), countAt(17)]).toEqual([
      9, 10, 6, 4,
    ]);
  });

  it('is ordered by level, then name', () => {
    const sorted = [...specialFacilities].sort(
      (a, b) => a.level - b.level || a.name.localeCompare(b.name),
    );

    expect(specialFacilities.map(facility => facility.key)).toEqual(
      sorted.map(facility => facility.key),
    );
  });
});

describe('findSpecialFacility', () => {
  it('finds a facility by key', () => {
    expect(findSpecialFacility('war-room')?.name).toBe('War Room');
  });

  it('returns undefined for an unknown key', () => {
    expect(findSpecialFacility('moat')).toBeUndefined();
  });

  it('does not treat inherited object keys as facilities', () => {
    expect(findSpecialFacility('toString')).toBeUndefined();
  });
});
