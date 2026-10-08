import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorNote } from '~/atoms/ErrorNote';

const meta = {
  title: 'Atoms/ErrorNote',
  component: ErrorNote,
  args: {
    children: 'Could not save.',
  },
} satisfies Meta<typeof ErrorNote>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
