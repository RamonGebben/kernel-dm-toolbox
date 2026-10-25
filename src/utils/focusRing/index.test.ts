import { describe, expect, it } from 'vitest';
import { focusRing } from '~/utils/focusRing';

describe('focusRing', () => {
  it('layers the accent outside a gap in the page background', () => {
    const theme = { color: (hue: string) => `var(--${hue})` };

    expect(focusRing(theme)).toBe(
      '0 0 0 2px var(--background), 0 0 0 4px var(--primary)',
    );
  });
});
