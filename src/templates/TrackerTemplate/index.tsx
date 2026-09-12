'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '~/atoms/Panel';
import { OpenPlayerScreenLink } from '~/molecules/OpenPlayerScreenLink';

type TrackerTemplateProps = {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  librarySlot: ReactNode;
  encounterSlot: ReactNode;
  statblockSlot: ReactNode;
};

/**
 * The three-panel body: library, initiative order, selected statblock, with
 * the tool rail down the left edge.
 *
 * Props in, JSX out. Each panel arrives as a slot so the template never
 * fetches and every connected component stays independently testable.
 *
 * Laptop-first: three columns side by side, stacking on narrow screens so the
 * tool is usable from a tablet at the table.
 */
export const TrackerTemplate = ({
  navigationSlot,
  librarySlot,
  encounterSlot,
  statblockSlot,
}: TrackerTemplateProps) => (
  <Page>
    {navigationSlot}

    <Workspace>
      <Columns>
        <Panel title="Add Combatants" isBodyScrollable={false}>
          {librarySlot}
        </Panel>
        <Panel title="Combatants by Initiative">
          {encounterSlot}
          <Footer>
            <OpenPlayerScreenLink />
          </Footer>
        </Panel>
        <Panel title="Selected Combatant">{statblockSlot}</Panel>
      </Columns>
    </Workspace>
  </Page>
);

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;

  ${props => props.theme.media.lg} {
    flex-direction: row;
  }
`;

const Workspace = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.md};
  min-width: 0;
  min-height: 0;
`;

const Columns = styled.div`
  display: grid;
  flex: 1;
  min-height: 0;
  gap: ${props => props.theme.space.md};
  grid-template-columns: 1fr;
  /* Stacked on a tablet: each panel scrolls within a readable height. */
  grid-auto-rows: minmax(16rem, auto);
  overflow-y: auto;

  ${props => props.theme.media.lg} {
    grid-template-columns: minmax(0, 20rem) minmax(0, 1fr) minmax(0, 24rem);
    grid-auto-rows: unset;
    overflow-y: visible;
  }
`;

const Footer = styled.footer`
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: ${props => props.theme.space.md};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
