import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatblockLine } from '~/atoms/StatblockLine';

const meta = {
  title: 'Atoms/StatblockLine',
  component: StatblockLine,
  args: {
    children: 'StatblockLine',
  },
} satisfies Meta<typeof StatblockLine>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
