/**
 * Mobile-first breakpoints. Always consumed as `theme.media.*` inside a
 * styled-component, never as a raw pixel value.
 */
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;

export type BreakpointName = keyof typeof breakpoints;

export const media = {
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
} as const;
