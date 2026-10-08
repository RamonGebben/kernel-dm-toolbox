'use client';

import type { ReactNode } from 'react';
import { Panel } from '~/atoms/Panel';
import { Page } from '~/atoms/Page';
import { Workspace } from '~/atoms/Workspace';
import { Columns } from '~/atoms/Columns';

interface PartyTemplateProps {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  rosterSlot: ReactNode;
  treasurySlot: ReactNode;
}

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
      <Columns $columns="minmax(0, 3fr) minmax(16rem, 1fr)">
        <Panel title="Party">{rosterSlot}</Panel>
        <Panel title="Treasury">{treasurySlot}</Panel>
      </Columns>
    </Workspace>
  </Page>
);
