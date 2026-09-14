import { describe, expect, it } from 'vitest';
import { toClassFeatureRow } from '~/server/library/mappers/toClassFeatureRow';
import { classFeatureFixtureSchema } from '~/server/library/fixtures';

const abilityScoreImprovement = classFeatureFixtureSchema.parse({
  model: 'api_v2.classfeature',
  pk: 'srd-2024_barbarian_ability-score-improvement',
  fields: {
    name: 'Ability Score Improvement',
    desc: 'You gain the Ability Score Improvement feat...',
    document: 'srd-2024',
    parent: 'srd-2024_barbarian',
  },
});

describe('toClassFeatureRow', () => {
  it('links the feature to its class through parent', () => {
    expect(toClassFeatureRow(abilityScoreImprovement).classSlug).toBe(
      'srd-2024_barbarian',
    );
  });

  it('carries the reference text through unchanged', () => {
    expect(toClassFeatureRow(abilityScoreImprovement).desc).toContain(
      'Ability Score Improvement feat',
    );
  });
});
