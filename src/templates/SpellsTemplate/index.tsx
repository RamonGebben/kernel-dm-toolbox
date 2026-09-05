'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '~/atoms/Panel';

type SpellsTemplateProps = {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  librarySlot: ReactNode;
  /** The slide-in pane; positioned fixed, so it sits outside the column flow. */
  detailSlot: ReactNode;
};

/**
 * The quick spell lookup: a filterable list, with the selected spell's full
 * description sliding in from the right rather than taking a column of its
 * own — the list stays the only thing on screen until something is picked.
 */
export const SpellsTemplate = ({
  navigationSlot,
  librarySlot,
  detailSlot,
}: SpellsTemplateProps) => (
  <Page>
    {navigationSlot}

    <Workspace>
      <Panel title="Spells">{librarySlot}</Panel>
    </Workspace>

    {detailSlot}
  </Page>
);

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  height: 100dvh;
  padding: ${props => props.theme.space.md};

  ${props => props.theme.media.lg} {
    flex-direction: row;
  }
`;

const Workspace = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;

  ${props => props.theme.media.lg} {
    max-width: 28rem;
  }
`;
