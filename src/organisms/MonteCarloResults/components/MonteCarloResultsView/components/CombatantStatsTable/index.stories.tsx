import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CombatantStatsTable } from '~/organisms/MonteCarloResults/components/MonteCarloResultsView/components/CombatantStatsTable';

const meta = {
  title: 'Organisms/MonteCarloResults/CombatantStatsTable',
  component: CombatantStatsTable,
  args: {
    combatants: [
      {
        templateKey: 'hero',
        name: 'Ari',
        side: 'party',
        survivalRate: 0.92,
        wentDownRate: 0.15,
        averageDamageDealt: 14.3,
        averageDamageTaken: 9.1,
        killRate: 1.4,
      },
      {
        templateKey: 'goblin-entry',
        name: 'Goblin',
        side: 'monsters',
        survivalRate: 0.18,
        wentDownRate: 0,
        averageDamageDealt: 2.1,
        averageDamageTaken: 6.4,
        killRate: 0.05,
      },
    ],
  },
} satisfies Meta<typeof CombatantStatsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { combatants: [] },
};
