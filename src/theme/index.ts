import DesignSystem from '@pindakaasman/design-system';
import { tokens } from '~/theme/tokens';

/**
 * The theme instance passed to styled-components' ThemeProvider. Every colour
 * it hands out is a `var(--…)` reference rather than a hex literal, so a value
 * can be overridden at any DOM subtree with plain CSS and so devtools show a
 * name instead of an opaque colour.
 */
export const theme = new DesignSystem(tokens);

export type Theme = typeof theme;
