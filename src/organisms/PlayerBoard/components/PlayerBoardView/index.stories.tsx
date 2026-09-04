import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { PlayerBoardView } from '~/organisms/PlayerBoard/components/PlayerBoardView';

const combatants = [
  {
    id: 'meat',
    displayName: 'Meat',
    initiative: 19,
    isActive: false,
    isPlayerCharacter: false,
    healthStatus: 'healthy' as const,
  },
  {
    id: 'dragon',
    displayName: 'Young Black Dragon',
    initiative: 17,
    isActive: true,
    isPlayerCharacter: false,
    healthStatus: 'bloodied' as const,
  },
  {
    id: 'sigrid',
    displayName: 'Sigrid',
    initiative: 10,
    isActive: false,
    isPlayerCharacter: true,
    healthStatus: 'healthy' as const,
  },
  {
    id: 'hammie',
    displayName: 'Hammie',
    initiative: 5,
    isActive: false,
    isPlayerCharacter: true,
    healthStatus: 'unconscious' as const,
  },
];

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView',
  component: PlayerBoardView,
  args: { isConnected: true, roundNumber: 3, combatants },
} satisfies Meta<typeof PlayerBoardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const InCombat: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Round 3')).toBeVisible();
    await expect(canvas.getByText('Bloodied')).toBeVisible();
    await expect(canvas.getByText('Down')).toBeVisible();
  },
};

/** The whole point of the screen: exact hit points are never shown. */
export const NeverShowsExactHitPoints: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText(/\d+\/\d+/)).not.toBeInTheDocument();
    await expect(canvas.queryByText('127')).not.toBeInTheDocument();
  },
};

export const BeforeInitiativeIsRolled: Story = {
  args: { roundNumber: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Rolling for initiative')).toBeVisible();
  },
};

export const NoFight: Story = {
  args: { combatants: [], roundNumber: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No fight in progress')).toBeVisible();
  },
};

/** The stream dropped; the last known order stays on the wall. */
export const Disconnected: Story = {
  args: { isConnected: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Reconnecting…')).toBeVisible();
    await expect(canvas.getByText('Young Black Dragon')).toBeVisible();
  },
};
