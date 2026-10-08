'use client';

import { createGlobalStyle } from 'styled-components';
import { focusRing } from '~/utils/focusRing';

/**
 * Defines the CSS variables the theme's accessors return, then applies the
 * handful of element-level resets that every page depends on.
 *
 * There is one theme and it is dark: no `prefers-color-scheme` switching, no
 * light palette. The design system files that one palette under its "light"
 * mode and emits `color-scheme: light` alongside it, so the `:root` rule has
 * to come after `colorModeCss()` to pin the scheme back to dark.
 */
export const GlobalStyle = createGlobalStyle`
  ${({ theme }) => theme.colorModeCss()}
  ${({ theme }) => theme.breakpointCss()}

  :root {
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
    background: ${props => props.theme.color('background')};
    color: ${props => props.theme.color('background', 'text')};
    font-family: ${props => props.theme.fontFamily('base')};
    font-size: ${props => props.theme.fontSize('base')};
    line-height: ${props => props.theme.lineHeight('base')};
    -webkit-font-smoothing: antialiased;
  }

  :focus-visible {
    outline: none;
    box-shadow: ${props => focusRing(props.theme)};
  }
`;
