'use client';

import type { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { theme } from '~/theme';
import { GlobalStyle } from '~/providers/ThemeProvider/components/GlobalStyle';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * The theme plus the global styles that make it work: the CSS variables its
 * accessors return, and the app's element-level resets. Shared by the app
 * root and Storybook's preview, so a component can never look right in one
 * and wrong in the other.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <StyledThemeProvider theme={() => theme}>
    <GlobalStyle />
    {children}
  </StyledThemeProvider>
);
