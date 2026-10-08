import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Command } from '~/atoms/Command';

const meta = {
  title: 'Atoms/Command',
  component: Command,
  args: {
    children: 'Command',
  },
} satisfies Meta<typeof Command>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
