import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatblockEntryName } from '~/atoms/StatblockEntryName';

const meta = {
  title: 'Atoms/StatblockEntryName',
  component: StatblockEntryName,
  args: {
    children: 'Entry Name',
  },
} satisfies Meta<typeof StatblockEntryName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
