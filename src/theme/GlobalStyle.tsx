'use client';

import { createGlobalStyle } from 'styled-components';
import { cssVariableName, rawColors, type ColorName } from '~/theme/colors';

const colorCustomProperties = Object.entries(rawColors)
  .map(([name, value]) => `  ${cssVariableName(name as ColorName)}: ${value};`)
  .join('\n');

/**
 * Emits the raw palette as custom properties and applies the handful of
 * element-level resets that every page depends on. There is one theme and it
 * is dark: no `prefers-color-scheme` switching, no light palette.
 */
export const GlobalStyle = createGlobalStyle`
  :root {
${colorCustomProperties}
    color-scheme: dark;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    min-height: 100%;
  }

  body {
    background: ${props => props.theme.color.canvas};
    color: ${props => props.theme.color.textPrimary};
    font-family: ${props => props.theme.font.body};
    font-size: ${props => props.theme.fontSize.md};
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  :focus-visible {
    outline: none;
    box-shadow: ${props => props.theme.shadow.focus};
  }
`;
