import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Remove } from '~/molecules/ConditionBadges/components/Remove';

const meta = {
  title: 'Molecules/ConditionBadges/Remove',
  component: Remove,
  args: {
    children: 'Remove',
  },
} satisfies Meta<typeof Remove>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
