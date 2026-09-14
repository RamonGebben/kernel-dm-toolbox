import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RoundDistributionChart } from '~/organisms/MonteCarloResults/components/MonteCarloResultsView/components/RoundDistributionChart';

const meta = {
  title: 'Organisms/MonteCarloResults/RoundDistributionChart',
  component: RoundDistributionChart,
  args: {
    buckets: [
      { rounds: 2, trials: 3 },
      { rounds: 3, trials: 18 },
      { rounds: 4, trials: 42 },
      { rounds: 5, trials: 25 },
      { rounds: 6, trials: 9 },
      { rounds: 7, trials: 3 },
    ],
  },
} satisfies Meta<typeof RoundDistributionChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleBucket: Story = {
  args: { buckets: [{ rounds: 4, trials: 1 }] },
};

export const Empty: Story = {
  args: { buckets: [] },
};
