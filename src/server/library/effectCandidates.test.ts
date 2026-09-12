import { describe, expect, it } from 'vitest';
import {
  EFFECT_CANDIDATES,
  pickEffectSourcePath,
} from '~/server/library/effectCandidates';

describe('pickEffectSourcePath', () => {
  it('matches a known damage type and shape', () => {
    expect(pickEffectSourcePath(['fire'], 'circle')).toBe(
      'spell-effects/fire/fire_ball_CIRCLE_02.webm',
    );
  });

  it('is case-insensitive on the damage type', () => {
    expect(pickEffectSourcePath(['Fire'], 'circle')).toBe(
      'spell-effects/fire/fire_ball_CIRCLE_02.webm',
    );
  });

  it('uses the first recognised damage type for a spell with several', () => {
    expect(pickEffectSourcePath(['fire', 'radiant'], 'circle')).toBe(
      'spell-effects/fire/fire_ball_CIRCLE_02.webm',
    );
  });

  it('skips an unmatched damage type in favour of a later one', () => {
    // Bludgeoning has no entry at all; radiant does.
    expect(pickEffectSourcePath(['bludgeoning', 'radiant'], 'circle')).toBe(
      'spell-effects/misc/lathander_symbol_CIRCLE_01.webm',
    );
  });

  it('returns null when no damage type is recognised', () => {
    expect(pickEffectSourcePath(['bludgeoning'], 'circle')).toBeNull();
  });

  it('returns null for no damage type at all', () => {
    expect(pickEffectSourcePath([], 'cone')).toBeNull();
  });

  it('returns null when the matched damage type has no clip for that shape', () => {
    // Necrotic only has a circle clip.
    expect(pickEffectSourcePath(['necrotic'], 'cone')).toBeNull();
  });

  it('never matches a ruler — rulers are never spell-sourced', () => {
    expect(pickEffectSourcePath(['fire'], 'ruler')).toBeNull();
  });
});

describe('EFFECT_CANDIDATES', () => {
  it('names every path under spell-effects/, ending in .webm', () => {
    for (const shapes of Object.values(EFFECT_CANDIDATES)) {
      for (const path of Object.values(shapes ?? {})) {
        expect(path).toMatch(/^spell-effects\/[a-z0-9_-]+\/[\w.-]+\.webm$/);
      }
    }
  });

  it('has no entry for the purely physical damage types', () => {
    expect(EFFECT_CANDIDATES.bludgeoning).toBeUndefined();
    expect(EFFECT_CANDIDATES.piercing).toBeUndefined();
    expect(EFFECT_CANDIDATES.slashing).toBeUndefined();
  });
});
