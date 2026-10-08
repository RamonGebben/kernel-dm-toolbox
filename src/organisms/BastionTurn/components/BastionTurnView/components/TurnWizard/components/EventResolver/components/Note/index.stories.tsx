import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Note } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventResolver/components/Note';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/EventResolver/Note',
  component: Note,
  args: {
    children: 'Note',
  },
} satisfies Meta<typeof Note>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
