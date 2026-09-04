'use client';

import { useId, type ReactNode } from 'react';
import styled from 'styled-components';

type PanelProps = {
  title: string;
  /** Rendered beside the title — a close button, a count, a filter. */
  action?: ReactNode;
  /**
   * Whether the panel body owns the scrollbar. Set false when the content
   * scrolls part of itself and needs to keep something pinned — a filter box
   * that scrolled away with its own results would be a bug, not a layout.
   */
  isBodyScrollable?: boolean;
  children: ReactNode;
};

/**
 * The framed column the three-panel layout is built from. Its body scrolls
 * independently so the page itself never does.
 */
export const Panel = ({
  title,
  action,
  isBodyScrollable = true,
  children,
}: PanelProps) => {
  // Names the panel as a landmark, so assistive technology — and tests — can
  // address "the Add Combatants panel" rather than the whole page.
  const titleId = useId();

  return (
    <Frame aria-labelledby={titleId}>
      <Header>
        <Title id={titleId}>{title}</Title>
        {action}
      </Header>
      <Body $isScrollable={isBodyScrollable}>{children}</Body>
    </Frame>
  );
};

const Frame = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${props => props.theme.color.surface};
  border: 1px solid ${props => props.theme.color.border};
  border-top: 2px solid ${props => props.theme.color.accent};
  border-radius: ${props => props.theme.radius.md};
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.md};
  border-bottom: 1px solid ${props => props.theme.color.border};
`;

const Title = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  letter-spacing: 0.04em;
  color: ${props => props.theme.color.textPrimary};
`;

const Body = styled.div<{ $isScrollable: boolean }>`
  flex: 1;
  min-height: 0;
  overflow-y: ${props => (props.$isScrollable ? 'auto' : 'hidden')};
  padding: ${props => props.theme.space.md};
`;
