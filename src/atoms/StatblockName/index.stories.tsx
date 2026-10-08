import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatblockName } from '~/atoms/StatblockName';

const meta = {
  title: 'Atoms/StatblockName',
  component: StatblockName,
  args: {
    children: 'StatblockName',
  },
} satisfies Meta<typeof StatblockName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
