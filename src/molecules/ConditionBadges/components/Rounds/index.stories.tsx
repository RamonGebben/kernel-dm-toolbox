import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Rounds } from '~/molecules/ConditionBadges/components/Rounds';

const meta = {
  title: 'Molecules/ConditionBadges/Rounds',
  component: Rounds,
  args: {
    children: 'Rounds',
  },
} satisfies Meta<typeof Rounds>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
