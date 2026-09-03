/**
 * The single source of truth for every raw colour value in the app.
 *
 * Nothing else in the codebase may contain a hex value. These are emitted once
 * as CSS custom properties by `GlobalStyle`, and the `theme` object exposes
 * them as `var(--…)` references. Non-CSS contexts that need a literal value
 * (`manifest.ts`, `viewport.themeColor`) import this map directly rather than
 * duplicating the hex.
 */
export const rawColors = {
  // Surfaces, from furthest back to closest to the reader.
  canvas: '#0b0d12',
  surface: '#141822',
  surfaceRaised: '#1d2331',
  border: '#2b3346',

  // Text.
  textPrimary: '#e8ecf5',
  textMuted: '#94a0b8',
  textInverted: '#0b0d12',

  // Accent: the ember the whole toolbox is lit by.
  accent: '#e0904a',
  accentHover: '#f0a763',
  accentMuted: '#5c3d22',

  // Status.
  danger: '#e05a5a',
  success: '#5ac08a',
  warning: '#d9b155',
} as const;

export type ColorName = keyof typeof rawColors;

/** `canvas` doubles as the browser theme colour and the PWA background. */
export const themeColor = rawColors.canvas;

/** `--color-canvas` etc. Kept next to the map so the two can never drift. */
export const cssVariableName = (name: ColorName): string =>
  `--color-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
