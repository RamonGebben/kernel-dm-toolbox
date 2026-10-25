import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MonoMuted } from '~/atoms/MonoMuted';

const meta = {
  title: 'Atoms/MonoMuted',
  component: MonoMuted,
  args: {
    children: 'AC 15',
  },
} satisfies Meta<typeof MonoMuted>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
