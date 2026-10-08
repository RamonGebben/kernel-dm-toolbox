'use client';

import type { ReactNode } from 'react';
import { Wrapper } from '~/atoms/EmptyState/components/Wrapper';
import { Title } from '~/atoms/EmptyState/components/Title';
import { Description } from '~/atoms/EmptyState/components/Description';

interface EmptyStateProps {
  title: string;
  description: string;
  /** A command to run, or an action to take. */
  detail?: ReactNode;
}

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
