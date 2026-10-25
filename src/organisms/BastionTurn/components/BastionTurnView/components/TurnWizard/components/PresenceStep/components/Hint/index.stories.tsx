import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Hint } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/PresenceStep/components/Hint';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/PresenceStep/Hint',
  component: Hint,
  args: {
    children: 'Hint',
  },
} satisfies Meta<typeof Hint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
