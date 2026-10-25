import { describe, expect, it } from 'vitest';
import {
  healthStatusColor,
  healthStatusLabels,
} from '~/utils/healthStatusPresentation';

describe('healthStatusLabels', () => {
  it('renders the words a player could perceive, not a number', () => {
    expect(healthStatusLabels.healthy).toBe('Healthy');
    expect(healthStatusLabels.bloodied).toBe('Bloodied');
    expect(healthStatusLabels.unconscious).toBe('Down');
  });
});

describe('healthStatusColor', () => {
  it('draws each status in its own theme hue', () => {
    expect(healthStatusColor.healthy).toBe('tertiary');
    expect(healthStatusColor.bloodied).toBe('quaternary');
    expect(healthStatusColor.unconscious).toBe('error');
  });
});
