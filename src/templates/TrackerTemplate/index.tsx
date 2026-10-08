'use client';

import type { ReactNode } from 'react';
import { Panel } from '~/atoms/Panel';
import { OpenPlayerScreenLink } from '~/molecules/OpenPlayerScreenLink';
import { Page } from '~/atoms/Page';
import { Workspace } from '~/templates/TrackerTemplate/components/Workspace';
import { Columns } from '~/atoms/Columns';
import { Footer } from '~/templates/TrackerTemplate/components/Footer';

interface TrackerTemplateProps {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  librarySlot: ReactNode;
  encounterSlot: ReactNode;
  statblockSlot: ReactNode;
}

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
      <Columns $columns="minmax(0, 20rem) minmax(0, 1fr) minmax(0, 24rem)">
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
