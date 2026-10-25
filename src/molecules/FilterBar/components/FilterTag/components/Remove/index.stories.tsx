import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Remove } from '~/molecules/FilterBar/components/FilterTag/components/Remove';

const meta = {
  title: 'Molecules/FilterBar/FilterTag/Remove',
  component: Remove,
  args: {
    children: 'Remove',
  },
} satisfies Meta<typeof Remove>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
