import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { TrackerOverlayBoardView } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView';

const combatants = [
  {
    id: 'meat',
    displayName: 'Meat',
    initiative: 19,
    isActive: false,
    isPlayerCharacter: false,
    healthStatus: 'healthy' as const,
    conditions: [],
  },
  {
    id: 'dragon',
    displayName: 'Young Black Dragon',
    initiative: 17,
    isActive: true,
    isPlayerCharacter: false,
    healthStatus: 'bloodied' as const,
    conditions: [{ conditionSlug: 'poisoned', name: 'Poisoned' }],
  },
  {
    id: 'sigrid',
    displayName: 'Sigrid',
    initiative: 10,
    isActive: false,
    isPlayerCharacter: true,
    healthStatus: 'healthy' as const,
    conditions: [
      { conditionSlug: 'prone', name: 'Prone' },
      { conditionSlug: 'grappled', name: 'Grappled' },
    ],
  },
  {
    id: 'hammie',
    displayName: 'Hammie',
    initiative: 5,
    isActive: false,
    isPlayerCharacter: true,
    healthStatus: 'unconscious' as const,
    conditions: [],
  },
];

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView',
  component: TrackerOverlayBoardView,
  args: {
    isConnected: true,
    roundNumber: 3,
    combatants,
    showInitiative: true,
    showName: true,
    showHealth: true,
    showConditions: false,
  },
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <div style={{ width: 320, height: 260 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TrackerOverlayBoardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InCombat: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Round 3')).toBeVisible();
    await expect(canvas.getByText('Bloodied')).toBeVisible();
  },
};

export const InitiativeHidden: Story = {
  args: { showInitiative: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('19')).not.toBeInTheDocument();
    await expect(canvas.getByText('Meat')).toBeVisible();
  },
};

export const NameHidden: Story = {
  args: { showName: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('Meat')).not.toBeInTheDocument();
  },
};

export const HealthHidden: Story = {
  args: { showHealth: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('Bloodied')).not.toBeInTheDocument();
  },
};

export const OnlyInitiative: Story = {
  args: { showName: false, showHealth: false },
};

export const ConditionsShown: Story = {
  args: { showConditions: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Poisoned')).toBeVisible();
    await expect(canvas.getByText('Prone')).toBeVisible();
    await expect(canvas.getByText('Grappled')).toBeVisible();
  },
};

export const ConditionsHiddenByDefault: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('Poisoned')).not.toBeInTheDocument();
  },
};

export const NoFight: Story = {
  args: { combatants: [], roundNumber: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No fight in progress')).toBeVisible();
  },
};

export const Disconnected: Story = {
  args: { isConnected: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Reconnecting…')).toBeVisible();
  },
};
