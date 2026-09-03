'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';

export type StatusTone = 'neutral' | 'good' | 'bad';

type StatusShellProps = {
  tone: StatusTone;
  title: string;
  children: ReactNode;
};

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

const toneColor = {
  neutral: (color: { border: string }) => color.border,
  good: (color: { success: string }) => color.success,
  bad: (color: { danger: string }) => color.danger,
} as const;

const Panel = styled.section<{ $tone: StatusTone }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.lg};
  background: ${props => props.theme.color.surface};
  border: 1px solid ${props => props.theme.color.border};
  border-left: 3px solid ${props => toneColor[props.$tone](props.theme.color)};
  border-radius: ${props => props.theme.radius.md};
  box-shadow: ${props => props.theme.shadow.raised};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color.textMuted};
`;
