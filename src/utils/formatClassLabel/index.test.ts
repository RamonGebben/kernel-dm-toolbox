import { describe, expect, it } from 'vitest';
import { formatClassLabel } from '~/utils/formatClassLabel';

describe('formatClassLabel', () => {
  it('combines the class name and level', () => {
    expect(formatClassLabel('Barbarian', 5)).toBe('Barbarian 5');
  });

  it('returns null when there is no class yet', () => {
    expect(formatClassLabel(null, 1)).toBe(null);
  });
});
