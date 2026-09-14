import { describe, expect, it } from 'vitest';
import { buildClassTemplateMaterialization } from '~/server/trpc/helpers/buildClassTemplateMaterialization';

describe('buildClassTemplateMaterialization', () => {
  it('builds full-caster spell slots and drops zero-slot levels', () => {
    const result = buildClassTemplateMaterialization(
      { slug: 'srd-2024_wizard', subclassOfSlug: null, casterType: 'FULL' },
      3,
    );

    expect(result.spellSlots).toEqual([
      { spellLevel: 1, maxSlots: 4 },
      { spellLevel: 2, maxSlots: 2 },
    ]);
  });

  it('builds a single pact-slot row for a warlock', () => {
    const result = buildClassTemplateMaterialization(
      { slug: 'srd-2024_warlock', subclassOfSlug: null, casterType: 'PACT' },
      3,
    );

    expect(result.spellSlots).toEqual([{ spellLevel: 2, maxSlots: 2 }]);
  });

  it('produces no spell slots for a non-caster', () => {
    const result = buildClassTemplateMaterialization(
      { slug: 'srd-2024_fighter', subclassOfSlug: null, casterType: 'NONE' },
      5,
    );

    expect(result.spellSlots).toEqual([]);
  });

  it('materializes resource pools at the given level', () => {
    const result = buildClassTemplateMaterialization(
      { slug: 'srd-2024_barbarian', subclassOfSlug: null, casterType: 'NONE' },
      3,
    );

    expect(result.resources).toEqual([
      {
        resourceKey: 'rage',
        name: 'Rage',
        maxUses: 3,
        isUnlimited: false,
        resetsOn: 'LONG_REST',
      },
    ]);
  });

  it('marks an unlimited resource pool with a null maxUses', () => {
    const result = buildClassTemplateMaterialization(
      { slug: 'srd-2024_barbarian', subclassOfSlug: null, casterType: 'NONE' },
      20,
    );

    expect(result.resources).toEqual([
      {
        resourceKey: 'rage',
        name: 'Rage',
        maxUses: null,
        isUnlimited: true,
        resetsOn: 'LONG_REST',
      },
    ]);
  });

  it('omits a resource pool not yet unlocked at this level', () => {
    const result = buildClassTemplateMaterialization(
      { slug: 'srd-2024_cleric', subclassOfSlug: null, casterType: 'HALF' },
      1,
    );

    expect(result.resources).toEqual([]);
  });

  it('falls back to the base class progression for an unrecognized subclass', () => {
    const result = buildClassTemplateMaterialization(
      {
        slug: 'srd-2024_berserker',
        subclassOfSlug: 'srd-2024_barbarian',
        casterType: 'NONE',
      },
      3,
    );

    expect(result.resources).toEqual([
      {
        resourceKey: 'rage',
        name: 'Rage',
        maxUses: 3,
        isUnlimited: false,
        resetsOn: 'LONG_REST',
      },
    ]);
  });

  it('returns no resources for a class with none defined', () => {
    const result = buildClassTemplateMaterialization(
      { slug: 'srd-2024_wizard', subclassOfSlug: null, casterType: 'FULL' },
      5,
    );

    expect(result.resources).toEqual([]);
  });
});
