import { cssVariableName, rawColors, type ColorName } from '~/theme/colors';
import { media } from '~/theme/breakpoints';

/**
 * Every colour in the theme is a `var(--color-…)` reference rather than a hex
 * literal, so a value can be overridden at any DOM subtree with plain CSS and
 * so devtools show a name instead of an opaque colour.
 */
const colorVariables = Object.fromEntries(
  Object.keys(rawColors).map(name => [
    name,
    `var(${cssVariableName(name as ColorName)})`,
  ]),
) as Record<ColorName, string>;

export const theme = {
  color: colorVariables,
  space: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2.5rem',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    pill: '999px',
  },
  font: {
    body: 'var(--font-body)',
    mono: 'var(--font-mono)',
  },
  fontSize: {
    sm: '0.8125rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.75rem',
  },
  shadow: {
    raised: '0 1px 2px rgb(0 0 0 / 0.4), 0 4px 12px rgb(0 0 0 / 0.3)',
    focus: `0 0 0 2px ${colorVariables.canvas}, 0 0 0 4px ${colorVariables.accent}`,
  },
  gradient: {
    ember: `linear-gradient(135deg, ${colorVariables.accent}, ${colorVariables.accentHover})`,
  },
  media,
} as const;

export type Theme = typeof theme;

export { rawColors, themeColor } from '~/theme/colors';
export { breakpoints, media } from '~/theme/breakpoints';
