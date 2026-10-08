'use client';

import type { ReactNode } from 'react';
import { Panel } from '~/organisms/ConnectionStatus/components/StatusShell/components/Panel';
import { Title } from '~/organisms/ConnectionStatus/components/StatusShell/components/Title';

export type StatusTone = 'neutral' | 'good' | 'bad';

interface StatusShellProps {
  tone: StatusTone;
  title: string;
  children: ReactNode;
}

/**
 * The chrome shared by all three branches of `ConnectionStatusView`.
 *
 * This is a real named sub-component rather than a local JSX `const` or an
 * inline `renderX()` — the rule that keeps guard-clause branching readable.
 */
export const StatusShell = ({ tone, title, children }: StatusShellProps) => (
  <Panel $tone={tone}>
    <Title>{title}</Title>
    {children}
  </Panel>
);
