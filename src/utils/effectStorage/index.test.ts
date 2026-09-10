import { describe, expect, it } from 'vitest';
import { generateEffectStoragePath } from '~/utils/effectStorage';

describe('generateEffectStoragePath', () => {
  it('is deterministic for the same source path', () => {
    const path = 'spell-effects/fire/fire_ball_CIRCLE_02.webm';
    expect(generateEffectStoragePath(path)).toBe(
      generateEffectStoragePath(path),
    );
  });

  it('differs between distinct source paths', () => {
    expect(
      generateEffectStoragePath('spell-effects/fire/fire_ball_CIRCLE_02.webm'),
    ).not.toBe(
      generateEffectStoragePath('spell-effects/ice/frost_CONE_01.webm'),
    );
  });

  it('always ends in .webm', () => {
    expect(generateEffectStoragePath('spell-effects/fire/x.webm')).toMatch(
      /\.webm$/,
    );
  });
});
