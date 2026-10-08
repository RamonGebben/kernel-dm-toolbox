'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';

type SectionHeadingProps = {
  children: ReactNode;
  /** Rendered at the far end — a count, an "Add" button. */
  action?: ReactNode;
};

/** A small uppercase heading that splits a panel into named sections. */
export const SectionHeading = ({ children, action }: SectionHeadingProps) => (
  <Row>
    <Heading>{children}</Heading>
    {action}
  </Row>
);

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Heading = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.color.textMuted};
`;
