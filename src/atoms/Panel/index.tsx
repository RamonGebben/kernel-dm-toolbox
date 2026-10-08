'use client';

import { useId, type ReactNode } from 'react';
import { Frame } from '~/atoms/Panel/components/Frame';
import { Header } from '~/atoms/Panel/components/Header';
import { Title } from '~/atoms/Panel/components/Title';
import { Body } from '~/atoms/Panel/components/Body';

interface PanelProps {
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
}

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
