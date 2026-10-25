'use client';

import type { ReactNode } from 'react';
import { Panel } from '~/atoms/Panel';
import { Page } from '~/atoms/Page';
import { Workspace } from '~/atoms/Workspace';
import { Columns } from '~/atoms/Columns';

interface SpellsTemplateProps {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  librarySlot: ReactNode;
  detailSlot: ReactNode;
}

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
      <Columns $columns="minmax(0, 1fr) minmax(0, 2fr)">
        <Panel title="Spells">{librarySlot}</Panel>
        <Panel title="Selected Spell">{detailSlot}</Panel>
      </Columns>
    </Workspace>
  </Page>
);
