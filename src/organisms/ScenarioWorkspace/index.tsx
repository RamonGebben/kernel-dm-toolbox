'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Tabs } from '~/atoms/Tabs';
import { ScenarioBuilder } from '~/organisms/ScenarioBuilder';
import { BattleViewer } from '~/organisms/BattleViewer';

type WorkspaceTab = 'build' | 'battle';

const TAB_OPTIONS = [
  { value: 'build' as const, label: 'Build' },
  { value: 'battle' as const, label: 'Battle' },
];

/**
 * Switches the simulator's "Scenario" panel between the build view (issue
 * #5, milestone 3) and the animated battle viewer (milestone 5). Fetches
 * nothing itself — `ScenarioBuilder` and `BattleViewer` are each their own
 * connected boundary, both reading the same `selectedScenarioId` from
 * `useScenarioSelectionStore`, so switching tabs never loses which scenario
 * is selected.
 */
export const ScenarioWorkspace = () => {
  const [tab, setTab] = useState<WorkspaceTab>('build');

  return (
    <Wrapper>
      <Tabs
        label="Scenario view"
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
      />
      <Body>{tab === 'build' ? <ScenarioBuilder /> : <BattleViewer />}</Body>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  height: 100%;
  min-height: 0;
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
`;
