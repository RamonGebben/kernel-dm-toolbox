import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MutedNote } from '~/atoms/MutedNote';

const meta = {
  title: 'Atoms/MutedNote',
  component: MutedNote,
  args: {
    children: 'Nothing here yet.',
  },
} satisfies Meta<typeof MutedNote>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
