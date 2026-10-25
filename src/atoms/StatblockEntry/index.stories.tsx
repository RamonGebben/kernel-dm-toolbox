import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatblockEntry } from '~/atoms/StatblockEntry';

const meta = {
  title: 'Atoms/StatblockEntry',
  component: StatblockEntry,
  args: {
    children: 'StatblockEntry',
  },
} satisfies Meta<typeof StatblockEntry>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
