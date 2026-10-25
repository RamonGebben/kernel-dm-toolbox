'use client';

import type { ReactNode } from 'react';
import { Panel } from '~/atoms/Panel';
import { Page } from '~/atoms/Page';
import { Workspace } from '~/atoms/Workspace';
import { Columns } from '~/atoms/Columns';

interface BastionsTemplateProps {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  listSlot: ReactNode;
  detailSlot: ReactNode;
}

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
      <Columns $columns="minmax(16rem, 1fr) minmax(0, 3fr)">
        <Panel title="Bastions">{listSlot}</Panel>
        <Panel title="Bastion">{detailSlot}</Panel>
      </Columns>
    </Workspace>
  </Page>
);
