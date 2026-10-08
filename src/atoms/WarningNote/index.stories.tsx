import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { WarningNote } from '~/atoms/WarningNote';

const meta = {
  title: 'Atoms/WarningNote',
  component: WarningNote,
  args: {
    children: 'Needs a level 9 character.',
  },
} satisfies Meta<typeof WarningNote>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
