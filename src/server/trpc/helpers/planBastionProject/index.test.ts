import { describe, expect, it } from 'vitest';
import {
  planBastionProject,
  toProjectCompletion,
} from '~/server/trpc/helpers/planBastionProject';

describe('planBastionProject', () => {
  it('prices a new basic facility by size', () => {
    expect(
      planBastionProject({
        kind: 'add-basic',
        basicType: 'kitchen',
        space: 'roomy',
      }),
    ).toEqual({
      ok: true,
      plan: {
        kind: 'add-basic',
        basicType: 'kitchen',
        space: 'roomy',
        facilityId: null,
        wallSquares: null,
        costGp: 1000,
        daysRemaining: 45,
      },
    });
  });

  it('enlarges a basic facility one step at a time', () => {
    const result = planBastionProject({
      kind: 'enlarge-basic',
      facility: { id: 'f1', space: 'cramped' },
    });

    expect(result).toMatchObject({
      ok: true,
      plan: {
        space: 'roomy',
        facilityId: 'f1',
        costGp: 500,
        daysRemaining: 25,
      },
    });
  });

  it('charges more for Roomy to Vast', () => {
    expect(
      planBastionProject({
        kind: 'enlarge-basic',
        facility: { id: 'f1', space: 'roomy' },
      }),
    ).toMatchObject({
      plan: { space: 'vast', costGp: 2000, daysRemaining: 80 },
    });
  });

  it('refuses to enlarge something already Vast', () => {
    expect(
      planBastionProject({
        kind: 'enlarge-basic',
        facility: { id: 'f1', space: 'vast' },
      }),
    ).toEqual({ ok: false, reason: 'already-vast' });
  });

  it('enlarges a Barrack to Vast for 2,000 GP and 80 days', () => {
    expect(
      planBastionProject({
        kind: 'enlarge-special',
        facility: { id: 'b1', facilityKey: 'barrack', space: 'roomy' },
      }),
    ).toMatchObject({
      ok: true,
      plan: {
        space: 'vast',
        facilityId: 'b1',
        costGp: 2000,
        daysRemaining: 80,
      },
    });
  });

  it('refuses to enlarge a facility the rules do not let grow', () => {
    expect(
      planBastionProject({
        kind: 'enlarge-special',
        facility: { id: 'l1', facilityKey: 'library', space: 'roomy' },
      }),
    ).toEqual({ ok: false, reason: 'cannot-enlarge' });
  });

  it('prices walls per square', () => {
    expect(planBastionProject({ kind: 'walls', squares: 8 })).toMatchObject({
      ok: true,
      plan: { wallSquares: 8, costGp: 2000, daysRemaining: 80 },
    });
  });

  it('refuses an empty or fractional wall', () => {
    expect(planBastionProject({ kind: 'walls', squares: 0 })).toEqual({
      ok: false,
      reason: 'no-squares',
    });
    expect(planBastionProject({ kind: 'walls', squares: 1.5 })).toEqual({
      ok: false,
      reason: 'no-squares',
    });
  });
});

describe('toProjectCompletion', () => {
  const blank = {
    basicType: null,
    space: null,
    facilityId: null,
    wallSquares: null,
  };

  it('turns a finished room into a new basic facility', () => {
    expect(
      toProjectCompletion({
        ...blank,
        kind: 'add-basic',
        basicType: 'bedroom',
        space: 'cramped',
      }),
    ).toEqual({ type: 'insert-basic', basicType: 'bedroom', space: 'cramped' });
  });

  it('resizes the enlarged facility', () => {
    expect(
      toProjectCompletion({
        ...blank,
        kind: 'enlarge-special',
        facilityId: 'b1',
        space: 'vast',
      }),
    ).toEqual({ type: 'resize-special', facilityId: 'b1', space: 'vast' });
  });

  it('adds the wall squares', () => {
    expect(
      toProjectCompletion({ ...blank, kind: 'walls', wallSquares: 4 }),
    ).toEqual({ type: 'add-walls', squares: 4 });
  });

  it('refuses a project with no target rather than finishing into nothing', () => {
    expect(() =>
      toProjectCompletion({ ...blank, kind: 'enlarge-basic' }),
    ).toThrow(/missing its target/);
  });
});
