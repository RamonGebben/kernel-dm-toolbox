'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '~/atoms/Panel';

type PartyTemplateProps = {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  rosterSlot: ReactNode;
  treasurySlot: ReactNode;
};

/**
 * The party: the roster gets most of the width, the shared treasury sits
 * beside it, stacking on narrow screens — the same `Page` / `Workspace`
 * shape as every other tool.
 */
export const PartyTemplate = ({
  navigationSlot,
  rosterSlot,
  treasurySlot,
}: PartyTemplateProps) => (
  <Page>
    {navigationSlot}

    <Workspace>
      <Columns>
        <Panel title="Party">{rosterSlot}</Panel>
        <Panel title="Treasury">{treasurySlot}</Panel>
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
  min-width: 0;
  min-height: 0;
  padding: ${props => props.theme.space.md};
`;

const Columns = styled.div`
  display: grid;
  flex: 1;
  min-height: 0;
  gap: ${props => props.theme.space.md};
  grid-template-columns: 1fr;
  grid-auto-rows: minmax(16rem, auto);
  overflow-y: auto;

  ${props => props.theme.media.lg} {
    grid-template-columns: minmax(0, 3fr) minmax(16rem, 1fr);
    grid-auto-rows: unset;
    overflow-y: visible;
  }
`;
