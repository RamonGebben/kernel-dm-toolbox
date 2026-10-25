import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Note } from '~/organisms/StatblockPanel/components/CharacterCard/components/Note';

const meta = {
  title: 'Organisms/StatblockPanel/CharacterCard/Note',
  component: Note,
  args: {
    children: 'Note',
  },
} satisfies Meta<typeof Note>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
