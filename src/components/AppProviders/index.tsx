'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { StyledComponentsRegistry } from '~/app/registry';
import { TRPCProvider } from '~/trpc/provider';
import { GlobalStyle } from '~/theme/GlobalStyle';
import { theme } from '~/theme';
import { DiceRollModal } from '~/organisms/DiceRollModal';

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * The single client boundary at the root of the tree. Wires the cross-cutting
 * concerns — style registry, theme, global CSS, tRPC + TanStack Query — so that
 * no other layout or page has to.
 *
 * `src/components/` is for exactly this kind of app-level provider or manager.
 * Feature UI belongs in atoms/molecules/organisms/templates.
 */
export const AppProviders = ({ children }: AppProvidersProps) => (
  <StyledComponentsRegistry>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <TRPCProvider>
        {children}
        <DiceRollModal />
      </TRPCProvider>
    </ThemeProvider>
  </StyledComponentsRegistry>
);
