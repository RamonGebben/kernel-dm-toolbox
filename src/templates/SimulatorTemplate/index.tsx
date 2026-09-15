'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { Panel } from '~/atoms/Panel';

type SimulatorTemplateProps = {
  /** The vertical tool rail, injected by the page. */
  navigationSlot: ReactNode;
  scenariosSlot: ReactNode;
  builderSlot: ReactNode;
};

/**
 * The encounter simulator's workspace: a scenario list beside the selected
 * scenario's build view — the same fixed two-panel shape as the Spells tab,
 * laptop-first side by side, stacking on narrow screens.
 */
export const SimulatorTemplate = ({
  navigationSlot,
  scenariosSlot,
  builderSlot,
}: SimulatorTemplateProps) => (
  <Page>
    {navigationSlot}

    <Workspace>
      <Columns>
        <Panel title="Scenarios">{scenariosSlot}</Panel>
        <Panel title="Scenario">{builderSlot}</Panel>
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

  ${props => props.theme.media.lg} {
    grid-template-columns: minmax(20rem, 1fr) minmax(0, 2fr);
  }
`;
