import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import styled from 'styled-components';
import { TrackerTemplate } from '~/templates/TrackerTemplate';

const PlaceholderSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 8rem;
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const PlaceholderRail = styled.div`
  display: flex;
  flex-direction: column;
  width: 3.5rem;
  border-right: 1px solid ${props => props.theme.color.border};
`;

/**
 * Every slot is a plain placeholder — this template only lays panels out,
 * it never fetches, so there is nothing state-dependent to drive through an
 * arg. The connected organisms that actually fill these slots
 * (`LibraryPanel`, `EncounterPanel`, `StatblockPanel`) carry their own
 * stories.
 */
const meta = {
  title: 'Templates/TrackerTemplate',
  component: TrackerTemplate,
  args: {
    navigationSlot: <PlaceholderRail />,
    librarySlot: <PlaceholderSlot>Creature/character library</PlaceholderSlot>,
    encounterSlot: <PlaceholderSlot>Combatants by initiative</PlaceholderSlot>,
    statblockSlot: (
      <PlaceholderSlot>Selected combatant&rsquo;s statblock</PlaceholderSlot>
    ),
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TrackerTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ThreePanelLayout: Story = {};
