import { describe, expect, it } from 'vitest';
import { isScenarioRunnable } from '~/utils/isScenarioRunnable';

describe('isScenarioRunnable', () => {
  it('requires at least one party member and one monster', () => {
    expect(isScenarioRunnable(1, 1)).toBe(true);
    expect(isScenarioRunnable(0, 1)).toBe(false);
    expect(isScenarioRunnable(1, 0)).toBe(false);
    expect(isScenarioRunnable(0, 0)).toBe(false);
  });
});
