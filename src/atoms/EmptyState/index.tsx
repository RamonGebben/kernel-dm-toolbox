'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';

type EmptyStateProps = {
  title: string;
  description: string;
  /** A command to run, or an action to take. */
  detail?: ReactNode;
};

/**
 * Used wherever a list has nothing in it. An empty library is a normal state
 * with an explanation, never a spinner and never an error.
 */
export const EmptyState = ({ title, description, detail }: EmptyStateProps) => (
  <Wrapper>
    <Title>{title}</Title>
    <Description>{description}</Description>
    {detail}
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xl} ${props => props.theme.space.md};
  text-align: center;
`;

const Title = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Description = styled.p`
  margin: 0;
  max-width: 32ch;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
