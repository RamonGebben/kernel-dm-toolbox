'use client';

import type { ReactNode } from 'react';
import { SpreadRow } from '~/atoms/SpreadRow';
import { Heading } from '~/atoms/SectionHeading/components/Heading';

interface SectionHeadingProps {
  children: ReactNode;
  /** Rendered at the far end — a count, an "Add" button. */
  action?: ReactNode;
}

/** A small uppercase heading that splits a panel into named sections. */
export const SectionHeading = ({ children, action }: SectionHeadingProps) => (
  <SpreadRow>
    <Heading>{children}</Heading>
    {action}
  </SpreadRow>
);
