'use client';

import { useState } from 'react';
import { Tabs, type TabOption } from '~/atoms/Tabs';
import { CreatureLibrary } from '~/organisms/CreatureLibrary';
import { CharacterRoster } from '~/organisms/CharacterRoster';
import { SavedEncounters } from '~/organisms/SavedEncounters';
import { FillStack } from '~/atoms/FillStack';
import { Content } from '~/organisms/LibraryPanel/components/Content';

type LibraryTab = 'creatures' | 'characters' | 'encounters';

/** Spells is a later milestone; the tab strip grows with it. */
const TAB_OPTIONS: ReadonlyArray<TabOption<LibraryTab>> = [
  { value: 'creatures', label: 'Creatures' },
  { value: 'characters', label: 'Characters' },
  { value: 'encounters', label: 'Encounters' },
] as const;

/**
 * The left panel: which source you are adding combatants from.
 *
 * The tab is ephemeral view state and belongs to this component, not to a
 * store — nothing else in the app needs to know which tab is open.
 */
export const LibraryPanel = () => {
  const [tab, setTab] = useState<LibraryTab>('creatures');

  return (
    <FillStack>
      <Tabs
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        label="Combatant source"
      />
      <Content>
        <TabContent tab={tab} />
      </Content>
    </FillStack>
  );
};

/**
 * A named subcomponent rather than a ternary chain, so each tab stays a guard
 * clause and adding the Spells tab is one more of them.
 */
const TabContent = ({ tab }: { tab: LibraryTab }) => {
  if (tab === 'creatures') return <CreatureLibrary />;
  if (tab === 'characters') return <CharacterRoster />;

  return <SavedEncounters />;
};
