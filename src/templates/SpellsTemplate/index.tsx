'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '~/atoms/Panel';

type SpellsTemplateProps = {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  librarySlot: ReactNode;
  detailSlot: ReactNode;
};

/**
 * The quick spell lookup: a filterable list beside the selected spell's full
 * description, laptop-first two columns side by side, stacking on narrow
 * screens — the same fixed-panel shape as the initiative tracker.
 */
export const SpellsTemplate = ({
  navigationSlot,
  librarySlot,
  detailSlot,
}: SpellsTemplateProps) => (
  <Page>
    {navigationSlot}

    <Workspace>
      <Columns>
        <Panel title="Spells">{librarySlot}</Panel>
        <Panel title="Selected Spell">{detailSlot}</Panel>
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
  /* Stacked on a tablet: each panel scrolls within a readable height. */
  grid-auto-rows: minmax(16rem, auto);
  overflow-y: auto;

  ${props => props.theme.media.lg} {
    /* The library gets roughly a third of the workspace, the description the rest. */
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    grid-auto-rows: unset;
    overflow-y: visible;
  }
`;
