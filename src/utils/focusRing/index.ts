interface FocusRingTheme {
  color: (hue: 'background' | 'primary') => string;
}

/**
 * The two-layer keyboard focus ring: a gap in the page background, then the
 * accent. Built from colour tokens rather than stored as a shadow token, since
 * it is an outline and not an elevation.
 */
export const focusRing = (theme: FocusRingTheme): string =>
  `0 0 0 2px ${theme.color('background')}, 0 0 0 4px ${theme.color('primary')}`;
