import { describe, expect, it } from 'vitest';
import { applySelfEmanationShape } from '~/server/library/selfEmanationSpellShapes';

describe('applySelfEmanationShape', () => {
  it('fills in the shape for a known self-emanation spell upstream left null', () => {
    const shape = applySelfEmanationShape('srd-2024_spirit-guardians', {
      shapeType: null,
      shapeSize: null,
      shapeSizeUnit: null,
    });

    expect(shape).toEqual({
      shapeType: 'emanation',
      shapeSize: 15,
      shapeSizeUnit: 'feet',
    });
  });

  it('leaves an unrelated shapeless spell untouched', () => {
    const shape = applySelfEmanationShape('srd-2024_acid-arrow', {
      shapeType: null,
      shapeSize: null,
      shapeSizeUnit: null,
    });

    expect(shape).toEqual({
      shapeType: null,
      shapeSize: null,
      shapeSizeUnit: null,
    });
  });

  it('never overrides a shape upstream actually provided', () => {
    const shape = applySelfEmanationShape('srd-2024_spirit-guardians', {
      shapeType: 'sphere',
      shapeSize: 20,
      shapeSizeUnit: 'feet',
    });

    expect(shape).toEqual({
      shapeType: 'sphere',
      shapeSize: 20,
      shapeSizeUnit: 'feet',
    });
  });
});
