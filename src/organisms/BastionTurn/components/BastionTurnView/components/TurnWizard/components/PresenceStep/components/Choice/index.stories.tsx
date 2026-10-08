import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Choice } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/PresenceStep/components/Choice';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/PresenceStep/Choice',
  component: Choice,
  args: {
    children: 'Choice',
  },
} satisfies Meta<typeof Choice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
