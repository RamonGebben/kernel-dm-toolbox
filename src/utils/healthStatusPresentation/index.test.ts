import { describe, expect, it } from 'vitest';
import {
  healthStatusColor,
  healthStatusLabels,
} from '~/utils/healthStatusPresentation';

const color = { success: 'green', warning: 'yellow', danger: 'red' };

describe('healthStatusLabels', () => {
  it('renders the words a player could perceive, not a number', () => {
    expect(healthStatusLabels.healthy).toBe('Healthy');
    expect(healthStatusLabels.bloodied).toBe('Bloodied');
    expect(healthStatusLabels.unconscious).toBe('Down');
  });
});

describe('healthStatusColor', () => {
  it('resolves each status against the theme colours passed in', () => {
    expect(healthStatusColor.healthy(color)).toBe('green');
    expect(healthStatusColor.bloodied(color)).toBe('yellow');
    expect(healthStatusColor.unconscious(color)).toBe('red');
  });
});
