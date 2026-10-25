import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatblockKey } from '~/atoms/StatblockKey';

const meta = {
  title: 'Atoms/StatblockKey',
  component: StatblockKey,
  args: {
    children: 'StatblockKey',
  },
} satisfies Meta<typeof StatblockKey>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
