'use client';

import type { ReactNode } from 'react';
import { StyledComponentsRegistry } from '~/providers/StyledComponentsRegistry';
import { TRPCProvider } from '~/providers/TRPCProvider';
import { ThemeProvider } from '~/providers/ThemeProvider';
import { DiceRollModal } from '~/organisms/DiceRollModal';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * The single client boundary at the root of the tree. Wires the cross-cutting
 * concerns — style registry, theme, global CSS, tRPC + TanStack Query — so that
 * no other layout or page has to.
 *
 * `src/providers/` is for exactly this kind of app-level provider or manager.
 * Feature UI belongs in atoms/molecules/organisms/templates.
 */
export const AppProviders = ({ children }: AppProvidersProps) => (
  <StyledComponentsRegistry>
    <ThemeProvider>
      <TRPCProvider>
        {children}
        <DiceRollModal />
      </TRPCProvider>
    </ThemeProvider>
  </StyledComponentsRegistry>
);
