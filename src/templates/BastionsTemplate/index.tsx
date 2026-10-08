'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '~/atoms/Panel';

type BastionsTemplateProps = {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  listSlot: ReactNode;
  detailSlot: ReactNode;
};

/**
 * Bastions: a narrow list of every character's bastion beside the selected
 * one in full, stacking on narrow screens — the same `Page` / `Workspace`
 * shape as every other tool.
 */
export const BastionsTemplate = ({
  navigationSlot,
  listSlot,
  detailSlot,
}: BastionsTemplateProps) => (
  <Page>
    {navigationSlot}

    <Workspace>
      <Columns>
        <Panel title="Bastions">{listSlot}</Panel>
        <Panel title="Bastion">{detailSlot}</Panel>
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
    grid-template-columns: minmax(16rem, 1fr) minmax(0, 3fr);
    grid-auto-rows: unset;
    overflow-y: visible;
  }
`;
