'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '~/atoms/Panel';

type TrackerTemplateProps = {
  campaignName: string;
  librarySlot: ReactNode;
  encounterSlot: ReactNode;
  statblockSlot: ReactNode;
  attribution: ReactNode;
};

/**
 * The three-panel body: library, initiative order, selected statblock.
 *
 * Props in, JSX out. Each panel arrives as a slot so the template never
 * fetches and every connected component stays independently testable.
 *
 * Laptop-first: three columns side by side, stacking on narrow screens so the
 * tool is usable from a tablet at the table.
 */
export const TrackerTemplate = ({
  campaignName,
  librarySlot,
  encounterSlot,
  statblockSlot,
  attribution,
}: TrackerTemplateProps) => (
  <Page>
    <Header>
      <Eyebrow>Campaign</Eyebrow>
      <CampaignName>{campaignName}</CampaignName>
    </Header>

    <Columns>
      <Panel title="Add Combatants" isBodyScrollable={false}>
        {librarySlot}
      </Panel>
      <Panel title="Combatants by Initiative">{encounterSlot}</Panel>
      <Panel title="Selected Combatant">{statblockSlot}</Panel>
    </Columns>

    <Footer>{attribution}</Footer>
  </Page>
);

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  height: 100dvh;
  padding: ${props => props.theme.space.md};
`;

const Header = styled.header`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.space.sm};
`;

const Eyebrow = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${props => props.theme.color.textMuted};
`;

const CampaignName = styled.h1`
  margin: 0;
  font-size: ${props => props.theme.fontSize.xl};
  color: ${props => props.theme.color.textPrimary};
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
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
