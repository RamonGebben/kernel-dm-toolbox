import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MutedCaption } from '~/atoms/MutedCaption';

const meta = {
  title: 'Atoms/MutedCaption',
  component: MutedCaption,
  args: {
    children: '3 of 12',
  },
} satisfies Meta<typeof MutedCaption>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
