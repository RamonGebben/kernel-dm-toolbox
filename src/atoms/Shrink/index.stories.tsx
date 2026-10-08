import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Shrink } from '~/atoms/Shrink';

const meta = {
  title: 'Atoms/Shrink',
  component: Shrink,
  args: {
    children: 'Content that may shrink',
  },
} satisfies Meta<typeof Shrink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
