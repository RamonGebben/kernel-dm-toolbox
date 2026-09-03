'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Tabs, type TabOption } from '~/atoms/Tabs';
import { CreatureLibrary } from '~/organisms/CreatureLibrary';
import { CharacterRoster } from '~/organisms/CharacterRoster';

type LibraryTab = 'creatures' | 'characters';

/** Encounters and Spells are later milestones; the tab strip grows with them. */
const TAB_OPTIONS: readonly TabOption<LibraryTab>[] = [
  { value: 'creatures', label: 'Creatures' },
  { value: 'characters', label: 'Characters' },
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
    <Wrapper>
      <Tabs
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        label="Combatant source"
      />
      <Content>
        {tab === 'creatures' ? <CreatureLibrary /> : <CharacterRoster />}
      </Content>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
  height: 100%;
  min-height: 0;
`;

const Content = styled.div`
  flex: 1;
  min-height: 0;
`;
